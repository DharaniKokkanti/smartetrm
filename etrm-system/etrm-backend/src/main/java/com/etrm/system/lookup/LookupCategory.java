package com.etrm.system.lookup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Read path only — see {@link LookupValue}'s doc comment. */
@Entity
@Table(name = "lookup_category")
public class LookupCategory {

    @Id
    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "category_code", nullable = false, length = 100)
    private String categoryCode;

    public Integer getCategoryId() {
        return categoryId;
    }

    public String getCategoryCode() {
        return categoryCode;
    }
}
