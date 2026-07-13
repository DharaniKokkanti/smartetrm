package com.etrm.system.fieldpermission;

import com.etrm.system.auth.AppUser;
import com.etrm.system.auth.AppUserRepository;
import com.etrm.system.rbac.UserRoleAssignment;
import com.etrm.system.rbac.UserRoleAssignmentRepository;
import com.etrm.system.common.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class FieldPermissionService {

    private static final Logger log = LoggerFactory.getLogger(FieldPermissionService.class);

    private final ScreenFieldRegistryRepository fieldRegistryRepo;
    private final ObjectLockRuleRepository lockRuleRepo;
    private final RoleFieldProfileRepository roleProfileRepo;
    private final FieldPermissionRuleRepository permRuleRepo;
    private final FieldPermissionProfileRepository profileRepo;
    private final AppUserRepository userRepo;
    private final UserRoleAssignmentRepository assignmentRepo;

    public FieldPermissionService(
            ScreenFieldRegistryRepository fieldRegistryRepo,
            ObjectLockRuleRepository lockRuleRepo,
            RoleFieldProfileRepository roleProfileRepo,
            FieldPermissionRuleRepository permRuleRepo,
            FieldPermissionProfileRepository profileRepo,
            AppUserRepository userRepo,
            UserRoleAssignmentRepository assignmentRepo) {
        this.fieldRegistryRepo = fieldRegistryRepo;
        this.lockRuleRepo      = lockRuleRepo;
        this.roleProfileRepo   = roleProfileRepo;
        this.permRuleRepo      = permRuleRepo;
        this.profileRepo       = profileRepo;
        this.userRepo          = userRepo;
        this.assignmentRepo    = assignmentRepo;
    }

    /**
     * Resolves the effective field permissions for a user on a screen,
     * merging Layer 1 (lifecycle locks) and Layer 2 (role profile rules).
     *
     * @param screenCode  the screen identifier (e.g. "TRADE_BLOTTER")
     * @param username    the authenticated user's username (from JWT principal)
     * @param lockContext the current state of the object being viewed; pass
     *                    ObjectLockContext.none() when no object context applies
     */
    public EffectiveFieldPermissionsResponse resolve(
            String screenCode,
            String username,
            ObjectLockContext lockContext) {

        // ── 1. Load all registered fields for this screen ────────────────────
        List<ScreenFieldRegistry> fields =
                fieldRegistryRepo.findByScreenCodeAndIsActiveTrueOrderBySortOrder(screenCode);

        if (fields.isEmpty()) {
            return new EffectiveFieldPermissionsResponse(
                    screenCode, Map.of(), Map.of(), List.of());
        }

        Set<String> allFieldKeys = fields.stream()
                .map(ScreenFieldRegistry::getFieldKey)
                .collect(Collectors.toSet());

        // ── 2. Layer 1: evaluate object_lock_rules ───────────────────────────
        Map<String, AccessLevel> layer1 = new HashMap<>();
        Map<String, String> lockReasons = new HashMap<>();

        List<ObjectLockRule> lockRules =
                lockRuleRepo.findByScreenCodeAndIsActiveTrueOrderBySortOrder(screenCode);

        for (ObjectLockRule rule : lockRules) {
            if (!conditionMatches(rule, lockContext)) continue;

            AccessLevel lockedLevel = AccessLevel.valueOf(rule.getLockedTo());
            String reason = rule.getLockReason();

            if ("*".equals(rule.getFieldKey())) {
                // wildcard — lock every field on this screen
                for (String key : allFieldKeys) {
                    applyLayer1Lock(layer1, lockReasons, key, lockedLevel, reason);
                }
            } else {
                applyLayer1Lock(layer1, lockReasons, rule.getFieldKey(), lockedLevel, reason);
            }
        }

        // ── 3. Layer 2: load role-based field permission profile ─────────────
        AppUser user = userRepo.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        List<UserRoleAssignment> assignments =
                assignmentRepo.findByUserIdAndIsActiveTrue(user.getUserId());

        List<Integer> roleIds = assignments.stream()
                .filter(a -> "ACTIVE".equals(a.getStatus()))
                .map(a -> a.getRole().getRoleId())
                .toList();

        Map<String, AccessLevel> layer2 = new HashMap<>();

        if (!roleIds.isEmpty()) {
            List<RoleFieldProfile> roleProfiles =
                    roleProfileRepo.findByRoleIdsAndScreenCode(roleIds, screenCode);

            List<Integer> profileIds = roleProfiles.stream()
                    .map(rfp -> rfp.getProfile().getProfileId())
                    .toList();

            if (!profileIds.isEmpty()) {
                List<FieldPermissionRule> rules =
                        permRuleRepo.findByScreenCodeAndProfileIds(screenCode, profileIds);

                // Multi-role additive merge: take the MOST permissive across all roles
                for (FieldPermissionRule rule : rules) {
                    String key = rule.getField().getFieldKey();
                    AccessLevel level = rule.getAccessLevel();
                    layer2.merge(key, level, AccessLevel::max);
                }
            }
        }

        // ── 4. Merge layer1 + layer2 (most restrictive wins) ─────────────────
        Map<String, String> effective = new LinkedHashMap<>();

        for (ScreenFieldRegistry field : fields) {
            String key = field.getFieldKey();

            AccessLevel l1 = layer1.getOrDefault(key, AccessLevel.EDIT);
            AccessLevel l2 = layer2.getOrDefault(key, AccessLevel.EDIT);

            AccessLevel merged = l1.min(l2);

            // Required fields cannot be hidden — clamp to VIEW
            if (field.getIsRequiredField() && merged == AccessLevel.HIDDEN) {
                log.warn("Field '{}' on screen '{}' is required and cannot be HIDDEN — clamping to VIEW", key, screenCode);
                merged = AccessLevel.VIEW;
            }

            effective.put(key, merged.name());
        }

        // ── 5. Build field metadata list ─────────────────────────────────────
        List<EffectiveFieldPermissionsResponse.FieldMeta> meta = fields.stream()
                .map(f -> new EffectiveFieldPermissionsResponse.FieldMeta(
                        f.getFieldKey(),
                        f.getFieldLabel(),
                        f.getFieldGroup(),
                        f.getIsRequiredField(),
                        f.getSortOrder()))
                .toList();

        return new EffectiveFieldPermissionsResponse(screenCode, effective, lockReasons, meta);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean conditionMatches(ObjectLockRule rule, ObjectLockContext ctx) {
        Set<String> values = Arrays.stream(rule.getConditionValues().split(","))
                .map(String::trim)
                .collect(Collectors.toSet());

        return switch (rule.getConditionType()) {
            case "TRADE_STATUS"  -> ctx.tradeStatus() != null && values.contains(ctx.tradeStatus());
            case "HAS_INVOICE"   -> ctx.hasInvoice()   && values.contains("true");
            case "HAS_COST"      -> ctx.hasCost()      && values.contains("true");
            case "HAS_SHIPMENT"  -> ctx.hasShipment()  && values.contains("true");
            case "TRADE_TYPE"    -> ctx.tradeType() != null && values.contains(ctx.tradeType());
            default -> false;
        };
    }

    private void applyLayer1Lock(
            Map<String, AccessLevel> layer1,
            Map<String, String> lockReasons,
            String key,
            AccessLevel level,
            String reason) {
        // Take the most restrictive lock if multiple rules apply to the same field
        layer1.merge(key, level, AccessLevel::min);
        if (reason != null) lockReasons.putIfAbsent(key, reason);
    }

    // ── Admin helpers ─────────────────────────────────────────────────────────

    public ProfileDetailResponse getProfileDetail(Integer profileId, String screenCode) {
        List<ScreenFieldRegistry> allFields =
                fieldRegistryRepo.findByScreenCodeAndIsActiveTrueOrderBySortOrder(screenCode);

        // Fetched directly rather than inferred from rules.get(0).getProfile()
        // — a profile legitimately has zero rules right after creation
        // (before anyone's assigned any), and inferring existence from the
        // rule list wrongly 404'd a perfectly real profile in that case.
        FieldPermissionProfile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new NotFoundException("Profile not found: " + profileId));

        List<FieldPermissionRule> rules = permRuleRepo.findByProfileProfileId(profileId);
        Map<Integer, String> ruleMap = rules.stream()
                .collect(Collectors.toMap(
                        r -> r.getField().getFieldId(),
                        FieldPermissionRule::getFieldPermission));

        List<ProfileDetailResponse.FieldRuleDto> ruleDtos = allFields.stream()
                .map(f -> new ProfileDetailResponse.FieldRuleDto(
                        f.getFieldId(),
                        f.getFieldKey(),
                        f.getFieldLabel(),
                        f.getFieldGroup(),
                        f.getIsRequiredField(),
                        f.getSortOrder(),
                        ruleMap.getOrDefault(f.getFieldId(), "EDIT")))
                .toList();

        return new ProfileDetailResponse(
                profile.getProfileId(),
                profile.getProfileCode(),
                profile.getProfileName(),
                profile.getDescription(),
                profile.getScreenCode(),
                ruleDtos);
    }
}
