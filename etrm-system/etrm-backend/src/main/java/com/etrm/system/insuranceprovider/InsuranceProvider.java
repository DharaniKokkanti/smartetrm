package com.etrm.system.insuranceprovider;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import com.etrm.system.common.SourceSystemDefaults;

/**
 * dbo.insurance_provider is NOT registered in master_data_table_registry —
 * a bespoke frontend page with no backend yet (deferred to a future
 * batch). Read-only for now, added early only so InsurancePolicyService
 * can resolve provider_id -> name for display.
 *
 * V128 — row_version added for schema consistency with the rest of this
 * batch; no write path exists through this entity today (see doc comment
 * above), so there's nothing yet for optimistic locking to protect.
 */
@Entity
@Table(name = "insurance_provider")
public class InsuranceProvider {

    @Id
    @Column(name = "provider_id")
    private Integer providerId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "provider_name", nullable = false, length = 200)
    private String providerName;

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    protected void onPrePersist() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    protected void onPreUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    public Integer getProviderId() {
        return providerId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public String getProviderName() {
        return providerName;
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
}
