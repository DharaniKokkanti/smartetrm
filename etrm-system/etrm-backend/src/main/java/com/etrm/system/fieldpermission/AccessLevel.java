package com.etrm.system.fieldpermission;

public enum AccessLevel {
    HIDDEN, VIEW, EDIT;

    /** Returns whichever level is more restrictive. HIDDEN < VIEW < EDIT. */
    public AccessLevel min(AccessLevel other) {
        return this.ordinal() <= other.ordinal() ? this : other;
    }

    /** Returns whichever level is more permissive — used for multi-role additive merge. */
    public AccessLevel max(AccessLevel other) {
        return this.ordinal() >= other.ordinal() ? this : other;
    }
}
