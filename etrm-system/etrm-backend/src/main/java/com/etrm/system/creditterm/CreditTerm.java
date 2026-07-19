package com.etrm.system.creditterm;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * dbo.credit_term is already registered in master_data_table_registry
 * (V72) and fully editable via the generic Tier 2 mechanism
 * (ReferenceDataController) — this entity is read-only, for other
 * services (CpCommercialTermsService) to resolve credit_term_id -> name
 * for display, not a competing write path.
 *
 * V128 — row_version added for schema consistency with the rest of this
 * batch, but this class carries no setter (see class doc comment above) and
 * ReferenceDataController's generic Tier 2 write path does not go through
 * this JPA entity, so optimistic locking is not actually enforced through
 * this class today — a future Tier 2 rollout would need to wire that up.
 */
@Entity
@Table(name = "credit_term")
public class CreditTerm {

    @Id
    @Column(name = "credit_term_id")
    private Integer creditTermId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "term_name", nullable = false, length = 200)
    private String termName;

    public Integer getCreditTermId() {
        return creditTermId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public String getTermName() {
        return termName;
    }
}
