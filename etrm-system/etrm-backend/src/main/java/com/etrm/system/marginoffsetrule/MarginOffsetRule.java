package com.etrm.system.marginoffsetrule;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.etrm.system.common.SourceSystemDefaults;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.margin_offset_rule (V205) — inter-commodity margin offset/netting
 * rules (spark/dark/crack spread IM discounts) published per exchange.
 * Legs reference market_product_link_id, not a free-text commodity code.
 * Standalone page keyed on exchange_id, same filtered-endpoint rationale
 * as ContractMarginRate/ClearingAccountMarginRate.
 */
@Entity
@Table(name = "ref_margin_offset_rule")
@EntityListeners(AuditingEntityListener.class)
public class MarginOffsetRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "margin_offset_rule_id")
    private Integer marginOffsetRuleId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "exchange_id", nullable = false)
    private Integer exchangeId;

    @Transient
    @JsonProperty
    private String exchangeCode;

    @NotNull
    @Column(name = "leg1_market_product_link_id", nullable = false)
    private Integer leg1MarketProductLinkId;

    @Transient
    @JsonProperty
    private String leg1Label;

    @NotNull
    @Column(name = "leg2_market_product_link_id", nullable = false)
    private Integer leg2MarketProductLinkId;

    @Transient
    @JsonProperty
    private String leg2Label;

    @NotNull
    @Column(name = "offset_ratio_leg1", nullable = false)
    private BigDecimal offsetRatioLeg1;

    @NotNull
    @Column(name = "offset_ratio_leg2", nullable = false)
    private BigDecimal offsetRatioLeg2;

    @NotNull
    @Column(name = "im_reduction_pct", nullable = false)
    private BigDecimal imReductionPct;

    @NotNull
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @LastModifiedBy
    @Column(name = "updated_by", nullable = false, length = 100)
    private String updatedBy;

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    void onCreate() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    void onUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    public Integer getMarginOffsetRuleId() { return marginOffsetRuleId; }
    public void setMarginOffsetRuleId(Integer marginOffsetRuleId) { this.marginOffsetRuleId = marginOffsetRuleId; }

    public Integer getRowVersion() { return rowVersion; }
    public void setRowVersion(Integer rowVersion) { this.rowVersion = rowVersion; }

    public Integer getExchangeId() { return exchangeId; }
    public void setExchangeId(Integer exchangeId) { this.exchangeId = exchangeId; }

    public String getExchangeCode() { return exchangeCode; }
    public void setExchangeCode(String exchangeCode) { this.exchangeCode = exchangeCode; }

    public Integer getLeg1MarketProductLinkId() { return leg1MarketProductLinkId; }
    public void setLeg1MarketProductLinkId(Integer leg1MarketProductLinkId) { this.leg1MarketProductLinkId = leg1MarketProductLinkId; }

    public String getLeg1Label() { return leg1Label; }
    public void setLeg1Label(String leg1Label) { this.leg1Label = leg1Label; }

    public Integer getLeg2MarketProductLinkId() { return leg2MarketProductLinkId; }
    public void setLeg2MarketProductLinkId(Integer leg2MarketProductLinkId) { this.leg2MarketProductLinkId = leg2MarketProductLinkId; }

    public String getLeg2Label() { return leg2Label; }
    public void setLeg2Label(String leg2Label) { this.leg2Label = leg2Label; }

    public BigDecimal getOffsetRatioLeg1() { return offsetRatioLeg1; }
    public void setOffsetRatioLeg1(BigDecimal offsetRatioLeg1) { this.offsetRatioLeg1 = offsetRatioLeg1; }

    public BigDecimal getOffsetRatioLeg2() { return offsetRatioLeg2; }
    public void setOffsetRatioLeg2(BigDecimal offsetRatioLeg2) { this.offsetRatioLeg2 = offsetRatioLeg2; }

    public BigDecimal getImReductionPct() { return imReductionPct; }
    public void setImReductionPct(BigDecimal imReductionPct) { this.imReductionPct = imReductionPct; }

    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    public LocalDate getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(LocalDate effectiveTo) { this.effectiveTo = effectiveTo; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public Short getCreatedSrcId() { return createdSrcId; }
    public void setCreatedSrcId(Short createdSrcId) { this.createdSrcId = createdSrcId; }

    public Short getUpdatedSrcId() { return updatedSrcId; }
    public void setUpdatedSrcId(Short updatedSrcId) { this.updatedSrcId = updatedSrcId; }
}
