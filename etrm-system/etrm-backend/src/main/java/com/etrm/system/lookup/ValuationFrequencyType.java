package com.etrm.system.lookup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "valuation_frequency_type")
public class ValuationFrequencyType extends TypeCodeLookup {
    @Id
    @Column(name = "valuation_frequency_type_id")
    private Integer valuationFrequencyTypeId;

    public Integer getValuationFrequencyTypeId() {
        return valuationFrequencyTypeId;
    }
}
