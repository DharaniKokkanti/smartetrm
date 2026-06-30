package com.etrm.system.fieldpermission;

import java.util.List;
import java.util.Map;

/**
 * Outbound DTO returned by GET /api/v1/permissions/effective-fields.
 * permissions: fieldKey → "EDIT" | "VIEW" | "HIDDEN"
 * lockedFields: fieldKey → reason string (Layer 1 locks only, for tooltip display)
 */
public record EffectiveFieldPermissionsResponse(
        String screenCode,
        Map<String, String> permissions,
        Map<String, String> lockedFields,
        List<FieldMeta> fieldRegistry
) {
    public record FieldMeta(
            String fieldKey,
            String fieldLabel,
            String fieldGroup,
            boolean isRequiredField,
            int sortOrder
    ) {}
}
