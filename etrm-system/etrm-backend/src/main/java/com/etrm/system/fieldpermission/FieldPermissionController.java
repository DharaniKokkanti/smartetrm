package com.etrm.system.fieldpermission;

import com.etrm.system.common.NotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for the field-level permission system.
 *
 *  GET  /api/v1/permissions/effective-fields?screen=TRADE_BLOTTER
 *  GET  /api/v1/permissions/effective-fields?screen=TRADE_BLOTTER&tradeStatus=CONFIRMED&hasInvoice=false
 *  GET  /api/v1/permissions/screens
 *  GET  /api/v1/permissions/profiles?screen=TRADE_BLOTTER
 *  GET  /api/v1/permissions/profiles/{profileId}?screen=TRADE_BLOTTER
 *  PUT  /api/v1/permissions/profiles/{profileId}/rules
 *  POST /api/v1/permissions/profiles
 */
@RestController
@RequestMapping("/api/v1/permissions")
public class FieldPermissionController {

    private final FieldPermissionService service;
    private final FieldPermissionProfileRepository profileRepo;
    private final ScreenFieldRegistryRepository fieldRegistryRepo;
    private final FieldPermissionRuleRepository ruleRepo;

    public FieldPermissionController(
            FieldPermissionService service,
            FieldPermissionProfileRepository profileRepo,
            ScreenFieldRegistryRepository fieldRegistryRepo,
            FieldPermissionRuleRepository ruleRepo) {
        this.service           = service;
        this.profileRepo       = profileRepo;
        this.fieldRegistryRepo = fieldRegistryRepo;
        this.ruleRepo          = ruleRepo;
    }

    /**
     * Primary endpoint — resolves the effective field permissions for the
     * authenticated user on the given screen, optionally considering the
     * current object state (Layer 1 lifecycle locks).
     */
    @GetMapping("/effective-fields")
    public EffectiveFieldPermissionsResponse getEffectiveFields(
            @RequestParam String screen,
            @RequestParam(required = false) String tradeStatus,
            @RequestParam(required = false, defaultValue = "false") boolean hasInvoice,
            @RequestParam(required = false, defaultValue = "false") boolean hasCost,
            @RequestParam(required = false, defaultValue = "false") boolean hasShipment,
            @RequestParam(required = false) String tradeType,
            Authentication auth) {

        ObjectLockContext ctx = new ObjectLockContext(
                tradeStatus, hasInvoice, hasCost, hasShipment, tradeType);

        return service.resolve(screen, auth.getName(), ctx);
    }

    /** Returns the list of distinct screen codes that have registered fields. */
    @GetMapping("/screens")
    public List<String> getScreens() {
        return fieldRegistryRepo.findDistinctScreenCodeByIsActiveTrue();
    }

    /** Returns all active profiles for a given screen. */
    @GetMapping("/profiles")
    public List<FieldPermissionProfile> getProfiles(@RequestParam String screen) {
        return profileRepo.findByScreenCodeAndIsActiveTrueOrderByProfileName(screen);
    }

    /** Returns a profile with its full per-field rule detail — used by the admin UI. */
    @GetMapping("/profiles/{profileId}")
    public ProfileDetailResponse getProfileDetail(
            @PathVariable Integer profileId,
            @RequestParam String screen) {
        return service.getProfileDetail(profileId, screen);
    }

    /** Creates a new permission profile. */
    @PostMapping("/profiles")
    @ResponseStatus(HttpStatus.CREATED)
    public FieldPermissionProfile createProfile(
            @RequestBody FieldPermissionProfile profile,
            Authentication auth) {
        profile.setProfileId(null);
        profile.setCreatedBy(auth.getName());
        profile.setUpdatedBy(auth.getName());
        return profileRepo.save(profile);
    }

    /** Replaces all field-level rules for an existing profile. */
    @PutMapping("/profiles/{profileId}/rules")
    @Transactional
    public ProfileDetailResponse updateProfileRules(
            @PathVariable Integer profileId,
            @RequestBody List<RuleUpdateRequest> rules,
            Authentication auth) {

        FieldPermissionProfile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new NotFoundException("Profile not found: " + profileId));

        profile.setUpdatedBy(auth.getName());
        profileRepo.save(profile);

        ruleRepo.deleteByProfileProfileId(profileId);

        for (RuleUpdateRequest req : rules) {
            ScreenFieldRegistry field = fieldRegistryRepo.findById(req.fieldId())
                    .orElseThrow(() -> new NotFoundException("Field not found: " + req.fieldId()));
            FieldPermissionRule rule = new FieldPermissionRule();
            rule.setProfile(profile);
            rule.setField(field);
            rule.setFieldPermission(req.fieldPermission());
            ruleRepo.save(rule);
        }

        return service.getProfileDetail(profileId, profile.getScreenCode());
    }

    public record RuleUpdateRequest(Integer fieldId, String fieldPermission) {}
}
