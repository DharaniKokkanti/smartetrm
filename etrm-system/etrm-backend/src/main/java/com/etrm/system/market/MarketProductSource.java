package com.etrm.system.market;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Read-only — the frontend (markets/api.ts's listSources) never writes this. */
@Entity
@Table(name = "market_product_source")
public class MarketProductSource {

    @Id
    @Column(name = "mps_id")
    private Integer mpsId;

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    // Read-only entity today (no create/update endpoint), added for schema
    // consistency and in case a write path is added later.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

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

    // V147 — added for schema consistency (read-only entity today, same
    // rationale as row_version above; no create/update endpoint writes
    // these, so plain @Column with no JPA-auditing annotation, matching
    // created_at/created_by's existing shape in this class).
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", nullable = false, length = 100)
    private String updatedBy;

    public Integer getMpsId() {
        return mpsId;
    }

    public Integer getRowVersion() {
        return rowVersion;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }
}
