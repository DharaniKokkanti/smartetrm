package com.etrm.system.market;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Read-only — the frontend (markets/api.ts's listSources) never writes this. */
@Entity
@Table(name = "market_product_source")
public class MarketProductSource {

    @Id
    @Column(name = "mps_id")
    private Integer mpsId;

    @Column(name = "market_product_id", nullable = false)
    private Integer marketProductId;

    @Column(name = "price_source_id", nullable = false)
    private Integer priceSourceId;

    @Transient
    @JsonProperty
    private String sourceCode;

    @Transient
    @JsonProperty
    private String sourceName;

    @Column(name = "source_role", nullable = false, length = 20)
    private String sourceRole;

    @Column(name = "source_ticker", length = 100)
    private String sourceTicker;

    @Column(name = "source_field_code", length = 100)
    private String sourceFieldCode;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "notes", length = 300)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    public Integer getMpsId() {
        return mpsId;
    }

    public Integer getMarketProductId() {
        return marketProductId;
    }

    public Integer getPriceSourceId() {
        return priceSourceId;
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

    public String getSourceRole() {
        return sourceRole;
    }

    public String getSourceTicker() {
        return sourceTicker;
    }

    public String getSourceFieldCode() {
        return sourceFieldCode;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }
}
