package com.etrm.system.lookup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "lc_status_type")
public class LcStatusType extends TypeCodeLookup {
    @Id
    @Column(name = "lc_status_type_id")
    private Integer lcStatusTypeId;

    public Integer getLcStatusTypeId() {
        return lcStatusTypeId;
    }
}
