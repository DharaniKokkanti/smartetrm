package com.etrm.system.fieldpermission;

import java.util.List;

/** DTO for the admin UI — shows a profile and its per-field rules. */
public record ProfileDetailResponse(
        Long profileId,
        String profileCode,
        String profileName,
        String description,
        String screenCode,
        List<FieldRuleDto> rules
) {
    public record FieldRuleDto(
            Long fieldId,
            String fieldKey,
            String fieldLabel,
            String fieldGroup,
            boolean isRequiredField,
            int sortOrder,
            String fieldPermission   // EDIT | VIEW | HIDDEN
    ) {}
}
