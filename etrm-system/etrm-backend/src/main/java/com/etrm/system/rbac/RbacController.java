package com.etrm.system.rbac;

import com.etrm.system.auth.AppUser;
import com.etrm.system.auth.AppUserRepository;
import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * REST endpoints for RBAC management.
 *
 *  GET  /api/v1/app-modules
 *  GET  /api/v1/app-functions
 *
 *  GET  /api/v1/roles
 *  GET  /api/v1/roles/{id}          — includes role_function detail
 *  POST /api/v1/roles
 *  PUT  /api/v1/roles/{id}
 *  PATCH /api/v1/roles/{id}/submit   — DRAFT → PENDING_APPROVAL
 *  PATCH /api/v1/roles/{id}/approve  — PENDING_APPROVAL → APPROVED
 *  PATCH /api/v1/roles/{id}/reject   — PENDING_APPROVAL → REJECTED  { reason }
 *
 *  GET  /api/v1/role-assignments
 *  GET  /api/v1/users/{userId}/role-assignments
 *  POST /api/v1/users/{userId}/role-assignments  { roleId }
 *  PATCH /api/v1/role-assignments/{id}/approve
 *  PATCH /api/v1/role-assignments/{id}/reject    { reason }
 *  DELETE /api/v1/users/{userId}/role-assignments/{assignmentId}
 */
@RestController
@RequestMapping("/api/v1")
public class RbacController {

    private final AppModuleRepository          moduleRepo;
    private final AppFunctionRepository        functionRepo;
    private final UserRoleRepository           roleRepo;
    private final RoleFunctionRepository       roleFunctionRepo;
    private final UserRoleAssignmentRepository assignmentRepo;
    private final AppUserRepository            userRepo;

    public RbacController(
            AppModuleRepository moduleRepo,
            AppFunctionRepository functionRepo,
            UserRoleRepository roleRepo,
            RoleFunctionRepository roleFunctionRepo,
            UserRoleAssignmentRepository assignmentRepo,
            AppUserRepository userRepo) {
        this.moduleRepo       = moduleRepo;
        this.functionRepo     = functionRepo;
        this.roleRepo         = roleRepo;
        this.roleFunctionRepo = roleFunctionRepo;
        this.assignmentRepo   = assignmentRepo;
        this.userRepo         = userRepo;
    }

    // ── Modules ───────────────────────────────────────────────────────────────

    @GetMapping("/app-modules")
    public List<AppModule> listModules() {
        return moduleRepo.findAllByOrderBySortOrderAsc();
    }

    // ── Functions ─────────────────────────────────────────────────────────────

    @GetMapping("/app-functions")
    public List<AppFunction> listFunctions() {
        return functionRepo.findAllByOrderByModuleModuleIdAscSortOrderAsc();
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    @GetMapping("/roles")
    public List<UserRole> listRoles() {
        return roleRepo.findAll();
    }

    @GetMapping("/roles/{id}")
    public Map<String, Object> getRole(@PathVariable Long id) {
        UserRole role = roleRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("Role " + id + " not found"));
        List<RoleFunction> functions = roleFunctionRepo.findByRoleRoleId(id);
        return Map.of("role", role, "functions", functions);
    }

    @PostMapping("/roles")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public UserRole createRole(@RequestBody RoleRequest body) {
        if (roleRepo.existsByRoleCode(body.roleCode())) {
            throw new ConflictException("Role code '" + body.roleCode() + "' already exists.");
        }
        UserRole role = new UserRole();
        role.setRoleCode(body.roleCode());
        role.setRoleName(body.roleName());
        role.setDescription(body.description());
        role.setRoleType("CUSTOM");
        role.setStatus("DRAFT");
        role.setCreatedBy("system");
        role.setUpdatedBy("system");
        UserRole saved = roleRepo.save(role);
        saveGrantList(saved, body.functions());
        return saved;
    }

    @PutMapping("/roles/{id}")
    @Transactional
    public UserRole updateRole(@PathVariable Long id, @RequestBody RoleRequest body) {
        UserRole role = roleRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("Role " + id + " not found"));
        if ("SYSTEM".equals(role.getRoleType())) {
            throw new ConflictException("System roles cannot be edited.");
        }
        role.setRoleName(body.roleName());
        role.setDescription(body.description());
        role.setUpdatedBy("system");
        UserRole saved = roleRepo.save(role);
        roleFunctionRepo.deleteByRoleRoleId(id);
        saveGrantList(saved, body.functions());
        return saved;
    }

    @PatchMapping("/roles/{id}/submit")
    public UserRole submitRole(@PathVariable Long id) {
        UserRole role = roleRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("Role " + id + " not found"));
        role.setStatus("PENDING_APPROVAL");
        role.setSubmittedAt(Instant.now());
        role.setUpdatedBy("system");
        return roleRepo.save(role);
    }

    @PatchMapping("/roles/{id}/approve")
    public UserRole approveRole(@PathVariable Long id) {
        UserRole role = roleRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("Role " + id + " not found"));
        role.setStatus("APPROVED");
        role.setApprovedBy("system");
        role.setApprovedAt(Instant.now());
        role.setUpdatedBy("system");
        return roleRepo.save(role);
    }

    @PatchMapping("/roles/{id}/reject")
    public UserRole rejectRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        UserRole role = roleRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("Role " + id + " not found"));
        role.setStatus("REJECTED");
        role.setRejectionReason(body.get("reason"));
        role.setUpdatedBy("system");
        return roleRepo.save(role);
    }

    // ── Role assignments ──────────────────────────────────────────────────────

    @GetMapping("/role-assignments")
    public List<AssignmentResponse> listAllAssignments() {
        return assignmentRepo.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/users/{userId}/role-assignments")
    public List<AssignmentResponse> listUserAssignments(@PathVariable Long userId) {
        return assignmentRepo.findByUserIdAndIsActiveTrue(userId).stream().map(this::toResponse).toList();
    }

    @PostMapping("/users/{userId}/role-assignments")
    @ResponseStatus(HttpStatus.CREATED)
    public AssignmentResponse assignRole(@PathVariable Long userId, @RequestBody Map<String, Long> body) {
        Long roleId = body.get("roleId");
        UserRole role = roleRepo.findById(Objects.requireNonNull(roleId))
                .orElseThrow(() -> new NotFoundException("Role " + roleId + " not found"));
        if (!"APPROVED".equals(role.getStatus())) {
            throw new ConflictException("Only APPROVED roles can be assigned.");
        }
        userRepo.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new NotFoundException("User " + userId + " not found"));
        assignmentRepo.findByUserIdAndRoleRoleIdAndIsActiveTrue(userId, roleId).ifPresent(a -> {
            throw new ConflictException("User already has an active assignment for this role.");
        });
        UserRoleAssignment a = new UserRoleAssignment();
        a.setUserId(userId);
        a.setRole(role);
        a.setAssignedBy("system");
        a.setStatus("PENDING_APPROVAL");
        return toResponse(assignmentRepo.save(a));
    }

    @PatchMapping("/role-assignments/{id}/approve")
    public AssignmentResponse approveAssignment(@PathVariable Long id) {
        UserRoleAssignment a = assignmentRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("Assignment " + id + " not found"));
        a.setStatus("ACTIVE");
        a.setApprovedBy("system");
        a.setApprovedAt(Instant.now());
        return toResponse(assignmentRepo.save(a));
    }

    @PatchMapping("/role-assignments/{id}/reject")
    public AssignmentResponse rejectAssignment(@PathVariable Long id, @RequestBody Map<String, String> body) {
        UserRoleAssignment a = assignmentRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("Assignment " + id + " not found"));
        a.setStatus("REJECTED");
        a.setRejectionReason(body.get("reason"));
        return toResponse(assignmentRepo.save(a));
    }

    private AssignmentResponse toResponse(UserRoleAssignment a) {
        AppUser user = userRepo.findById(a.getUserId()).orElse(null);
        return AssignmentResponse.of(a, user);
    }

    @DeleteMapping("/users/{userId}/role-assignments/{assignmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeAssignment(@PathVariable Long userId, @PathVariable Long assignmentId) {
        UserRoleAssignment a = assignmentRepo.findById(Objects.requireNonNull(assignmentId))
                .orElseThrow(() -> new NotFoundException("Assignment " + assignmentId + " not found"));
        a.setIsActive(false);
        a.setStatus("EXPIRED");
        assignmentRepo.save(a);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void saveGrantList(UserRole role, List<FunctionGrant> grants) {
        if (grants == null) return;
        for (FunctionGrant g : grants) {
            AppFunction fn = functionRepo.findById(Objects.requireNonNull(g.functionId()))
                    .orElseThrow(() -> new NotFoundException("Function " + g.functionId() + " not found"));
            RoleFunction rf = new RoleFunction();
            rf.setRole(role);
            rf.setFunction(fn);
            rf.setAccessLevel(g.accessLevel());
            roleFunctionRepo.save(rf);
        }
    }

    // ── Request records ───────────────────────────────────────────────────────

    record RoleRequest(String roleCode, String roleName, String description, List<FunctionGrant> functions) {}
    record FunctionGrant(Long functionId, String accessLevel) {}
}
