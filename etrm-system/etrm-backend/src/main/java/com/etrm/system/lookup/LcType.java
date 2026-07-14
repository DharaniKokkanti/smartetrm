package com.etrm.system.lookup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "lc_type")
public class LcType extends TypeCodeLookup {
    @Id
    @Column(name = "lc_type_id")
    private Integer lcTypeId;

    public Integer getLcTypeId() {
        return lcTypeId;
    }
}
