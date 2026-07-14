package com.etrm.system.lookup;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;

/**
 * Shared shape for the many small dedicated "_type" tables in this schema
 * (id, type_code, type_name, description, sort_order, is_active, full
 * audit) — lc_type, lc_status_type, margin_agreement_type,
 * valuation_frequency_type, governing_law_type, credit_limit_type,
 * credit_limit_status_type, etc. Same "dedicated table, not lookup_value"
 * pattern as commodity_type/book_type (see Book.java's doc comment) — each
 * of these has its own real table with its own real FK, not a shared
 * category system. Read-only: all are already registered in
 * master_data_table_registry and fully editable via the generic Tier 2
 * mechanism; these subclasses exist purely so other services can resolve
 * an id to its code/name for translation and display.
 */
@MappedSuperclass
public abstract class TypeCodeLookup {

    @Column(name = "type_code", nullable = false, length = 50)
    protected String typeCode;

    @Column(name = "type_name", nullable = false, length = 100)
    protected String typeName;

    public String getTypeCode() {
        return typeCode;
    }

    public String getTypeName() {
        return typeName;
    }
}
