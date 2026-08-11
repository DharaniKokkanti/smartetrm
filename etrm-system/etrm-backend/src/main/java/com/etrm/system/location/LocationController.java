package com.etrm.system.location;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/logistics/locations/api.ts.
 */
@RestController
@RequestMapping("/api/v1/locations")
public class LocationController {

    private final LocationService service;
    private final LocationRoleAssignmentService roleService;

    public LocationController(LocationService service, LocationRoleAssignmentService roleService) {
        this.service = service;
        this.roleService = roleService;
    }

    @GetMapping
    public List<Location> list() {
        return service.list();
    }

    @GetMapping("/trading-desks")
    public List<Location> listTradingDesks() {
        return service.listTradingDesks();
    }

    @PostMapping
    public ResponseEntity<Location> create(@Valid @RequestBody Location input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Location update(@PathVariable Integer id, @Valid @RequestBody Location input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/roles")
    public List<LocationRoleAssignment> listRoles(@PathVariable Integer id) {
        return roleService.listForLocation(id);
    }

    @PostMapping("/{id}/roles")
    public ResponseEntity<LocationRoleAssignment> createRole(@PathVariable Integer id, @Valid @RequestBody LocationRoleAssignment input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.create(id, input));
    }

    @PutMapping("/{id}/roles/{roleId}")
    public LocationRoleAssignment updateRole(@PathVariable Integer id, @PathVariable Integer roleId, @Valid @RequestBody LocationRoleAssignment input) {
        return roleService.update(id, roleId, input);
    }

    @DeleteMapping("/{id}/roles/{roleId}")
    public ResponseEntity<Void> deleteRole(@PathVariable Integer id, @PathVariable Integer roleId) {
        roleService.delete(id, roleId);
        return ResponseEntity.noContent().build();
    }
}
