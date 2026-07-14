package com.etrm.system.lookup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "credit_limit_status_type")
public class CreditLimitStatusType extends TypeCodeLookup {
    @Id
    @Column(name = "credit_limit_status_type_id")
    private Integer creditLimitStatusTypeId;

    public Integer getCreditLimitStatusTypeId() {
        return creditLimitStatusTypeId;
    }
}
