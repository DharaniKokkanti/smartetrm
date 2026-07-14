package com.etrm.system.creditterm;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.credit_term is already registered in master_data_table_registry
 * (V72) and fully editable via the generic Tier 2 mechanism
 * (ReferenceDataController) — this entity is read-only, for other
 * services (CpCommercialTermsService) to resolve credit_term_id -> name
 * for display, not a competing write path.
 */
@Entity
@Table(name = "credit_term")
public class CreditTerm {

    @Id
    @Column(name = "credit_term_id")
    private Integer creditTermId;

    @Column(name = "term_name", nullable = false, length = 200)
    private String termName;

    public Integer getCreditTermId() {
        return creditTermId;
    }

    public String getTermName() {
        return termName;
    }
}
