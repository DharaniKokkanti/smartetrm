package com.etrm.system.lookup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "credit_limit_type")
public class CreditLimitType extends TypeCodeLookup {
    @Id
    @Column(name = "credit_limit_type_id")
    private Integer creditLimitTypeId;

    public Integer getCreditLimitTypeId() {
        return creditLimitTypeId;
    }
}
