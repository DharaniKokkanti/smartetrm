package com.etrm.system.incoterm;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.incoterm is already registered in master_data_table_registry
 * (generic Tier 2) — read-only here, added so ProductService can resolve
 * default_incoterm_id -> code for display. Column names are `code`/`name`,
 * not the type_code/type_name shape TypeCodeLookup covers.
 */
@Entity
@Table(name = "incoterm")
public class Incoterm {

    @Id
    @Column(name = "incoterm_id")
    private Integer incotermId;

    @Column(name = "code", nullable = false, length = 10)
    private String code;

    public Integer getIncotermId() {
        return incotermId;
    }

    public String getCode() {
        return code;
    }
}
