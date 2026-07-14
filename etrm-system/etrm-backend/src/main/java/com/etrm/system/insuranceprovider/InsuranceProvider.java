package com.etrm.system.insuranceprovider;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.insurance_provider is NOT registered in master_data_table_registry —
 * a bespoke frontend page with no backend yet (deferred to a future
 * batch). Read-only for now, added early only so InsurancePolicyService
 * can resolve provider_id -> name for display.
 */
@Entity
@Table(name = "insurance_provider")
public class InsuranceProvider {

    @Id
    @Column(name = "provider_id")
    private Integer providerId;

    @Column(name = "provider_name", nullable = false, length = 200)
    private String providerName;

    public Integer getProviderId() {
        return providerId;
    }

    public String getProviderName() {
        return providerName;
    }
}
