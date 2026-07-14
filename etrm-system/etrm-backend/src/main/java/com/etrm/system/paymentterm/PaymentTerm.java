package com.etrm.system.paymentterm;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.payment_term is NOT registered in master_data_table_registry —
 * contracts/payment-terms/PaymentTermsPage.tsx is a bespoke frontend page
 * with no backend at all yet (flagged in the original full-app audit,
 * belongs to the not-yet-started Contract & Legal batch). This entity is
 * read-only for now, added early only so CpCommercialTermsService can
 * resolve payment_term_id -> name for display — a full PaymentTermService/
 * Controller (create/update/deactivate) is still owed as part of that
 * later batch, reusing this same entity.
 */
@Entity
@Table(name = "payment_term")
public class PaymentTerm {

    @Id
    @Column(name = "payment_term_id")
    private Integer paymentTermId;

    @Column(name = "term_name", nullable = false, length = 200)
    private String termName;

    public Integer getPaymentTermId() {
        return paymentTermId;
    }

    public String getTermName() {
        return termName;
    }
}
