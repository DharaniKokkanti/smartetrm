package com.etrm.system.paymentterm;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.payment_method is served generically via the Tier2 reference-data
 * mechanism (no dedicated controller) — minimal read-only reader so
 * PaymentTermService can resolve payment_method -> its code for display.
 */
@Entity
@Table(name = "payment_method")
public class PaymentMethod {

    @Id
    @Column(name = "payment_method_id")
    private Integer paymentMethodId;

    @Column(name = "type_code", nullable = false, length = 30)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;

    public Integer getPaymentMethodId() {
        return paymentMethodId;
    }

    public String getTypeCode() {
        return typeCode;
    }

    public String getTypeName() {
        return typeName;
    }
}
