package com.etrm.system.lookup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "margin_agreement_type")
public class MarginAgreementType extends TypeCodeLookup {
    @Id
    @Column(name = "margin_agreement_type_id")
    private Integer marginAgreementTypeId;

    public Integer getMarginAgreementTypeId() {
        return marginAgreementTypeId;
    }
}
