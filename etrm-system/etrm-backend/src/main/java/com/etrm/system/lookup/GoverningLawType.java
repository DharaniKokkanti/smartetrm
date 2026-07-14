package com.etrm.system.lookup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "governing_law_type")
public class GoverningLawType extends TypeCodeLookup {
    @Id
    @Column(name = "governing_law_type_id")
    private Integer governingLawTypeId;

    public Integer getGoverningLawTypeId() {
        return governingLawTypeId;
    }
}
