package com.etrm.system.creditterm;

import com.etrm.system.common.SourceSystemDefaults;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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
@Table(name = "ref_credit_term")
public class CreditTerm {

    @Id
    @Column(name = "credit_term_id")
    private Integer creditTermId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "term_name", nullable = false, length = 200)
    private String termName;

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    public Integer getCreditTermId() {
        return creditTermId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public String getTermName() {
        return termName;
    }

    public Short getCreatedSrcId() {
        return createdSrcId;
    }

    public void setCreatedSrcId(Short createdSrcId) {
        this.createdSrcId = createdSrcId;
    }

    public Short getUpdatedSrcId() {
        return updatedSrcId;
    }

    @PrePersist
    protected void onCreate() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }
}
