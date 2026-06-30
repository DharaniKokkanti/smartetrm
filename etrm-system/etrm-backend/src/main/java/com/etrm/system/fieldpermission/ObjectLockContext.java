package com.etrm.system.fieldpermission;

/**
 * Describes the current state of the object being viewed/edited.
 * Used by Layer 1 to evaluate which object_lock_rules apply.
 * Pass null for fields that are not applicable to the current screen.
 */
public record ObjectLockContext(
        String tradeStatus,
        boolean hasInvoice,
        boolean hasCost,
        boolean hasShipment,
        String tradeType
) {
    public static ObjectLockContext none() {
        return new ObjectLockContext(null, false, false, false, null);
    }
}
