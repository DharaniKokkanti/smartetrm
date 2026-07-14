package com.etrm.system.lookup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Same TypeCodeLookup shape as LcType/etc. — see that class's doc comment. */
@Entity
@Table(name = "pricing_type")
public class PricingType extends TypeCodeLookup {
    @Id
    @Column(name = "pricing_type_id")
    private Integer pricingTypeId;

    public Integer getPricingTypeId() {
        return pricingTypeId;
    }
}
