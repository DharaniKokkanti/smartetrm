package com.etrm.system.pricesource;

import com.etrm.system.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Upgraded in place from the earlier minimal read-only reader (id/
 * sourceCode/sourceName only, used by MarketProductSourceService to resolve
 * price_source_id -> code/name for display) into the full entity behind
 * /api/v1/price-sources, per the "upgrade a minimal reader into a full
 * entity in place" convention (see UnitOfMeasure.java's doc comment) —
 * MarketProductSourceService's existing findById().getSourceCode() call
 * sites keep working unchanged. Full created_at/created_by/updated_at/
 * updated_by audit set confirmed live, so this extends AuditableEntity.
 * source_type, delivery_method and frequency are plain CHECK-constrained
 * strings, not FKs, matching the frontend's string-union types.
 */
@Entity
@Table(name = "price_source")
public class PriceSource extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "price_source_id")
    private Integer priceSourceId;

    @NotBlank
    @Size(max = 30)
    @Column(name = "source_code", nullable = false, length = 30)
    private String sourceCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "source_name", nullable = false, length = 200)
    private String sourceName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "source_type", nullable = false, length = 20)
    private String sourceType;

    @NotBlank
    @Size(max = 20)
    @Column(name = "delivery_method", nullable = false, length = 20)
    private String deliveryMethod;

    @NotBlank
    @Size(max = 20)
    @Column(name = "frequency", nullable = false, length = 20)
    private String frequency;

    @Size(max = 50)
    @Column(name = "timezone", length = 50)
    private String timezone;

    @Size(max = 300)
    @Column(name = "base_url", length = 300)
    private String baseUrl;

    @Size(max = 100)
    @Column(name = "credentials_ref", length = 100)
    private String credentialsRef;

    @Column(name = "sla_minutes")
    private Short slaMinutes;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    public Integer getPriceSourceId() {
        return priceSourceId;
    }

    public void setPriceSourceId(Integer priceSourceId) {
        this.priceSourceId = priceSourceId;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public String getSourceType() {
        return sourceType;
    }

    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }

    public String getDeliveryMethod() {
        return deliveryMethod;
    }

    public void setDeliveryMethod(String deliveryMethod) {
        this.deliveryMethod = deliveryMethod;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getCredentialsRef() {
        return credentialsRef;
    }

    public void setCredentialsRef(String credentialsRef) {
        this.credentialsRef = credentialsRef;
    }

    public Short getSlaMinutes() {
        return slaMinutes;
    }

    public void setSlaMinutes(Short slaMinutes) {
        this.slaMinutes = slaMinutes;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
