package com.etrm.system.brokerfeeagreement;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.broker_fee_agreement only ever got created_at, matching the frontend
 * type (no updatedAt).
 *
 * V144 — created_at upgraded from a plain @Column to a real @CreatedDate
 * JPA-auditing field, and created_by/updated_at/updated_by added, matching
 * GlAccount's shape.
 */
@Entity
@Table(name = "broker_fee_agreement")
@EntityListeners(AuditingEntityListener.class)
public class BrokerFeeAgreement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "agreement_id")
    private Integer agreementId;

    // V128 — optimistic locking (see LegalEntity.rowVersion doc comment).
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "broker_id", nullable = false)
    private Integer brokerId;

    @Transient
    @JsonProperty
    private String brokerCode;

    @Transient
    @JsonProperty
    private String brokerName;

    @NotBlank
    @Size(max = 30)
    @Column(name = "agreement_code", nullable = false, length = 30)
    private String agreementCode;

    @Size(max = 300)
    @Column(name = "description", length = 300)
    private String description;

    @Size(max = 20)
    @Column(name = "commodity_type", length = 20)
    private String commodityType;

    @Column(name = "product_id")
    private Integer productId;

    @Transient
    @JsonProperty
    private String productName;

    @Size(max = 15)
    @Column(name = "trade_type", length = 15)
    private String tradeType;

    @NotBlank
    @Column(name = "fee_type", nullable = false, length = 20)
    private String feeType;

    @NotNull
    @Column(name = "fee_rate", nullable = false)
    private BigDecimal feeRate;

    @NotNull
    @Column(name = "fee_currency_id", nullable = false)
    private Integer feeCurrencyId;

    @Transient
    @JsonProperty
    private String feeCurrencyCode;

    @Column(name = "uom_id")
    private Integer uomId;

    @Transient
    @JsonProperty
    private String uomCode;

    @NotBlank
    @Column(name = "pay_period", nullable = false, length = 15)
    private String payPeriod;

    @NotNull
    @Column(name = "payment_due_days", nullable = false)
    private Integer paymentDueDays;

    @Column(name = "minimum_fee")
    private BigDecimal minimumFee;

    @Column(name = "maximum_fee")
    private BigDecimal maximumFee;

    @NotNull
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

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

    public Integer getAgreementId() {
        return agreementId;
    }

    public void setAgreementId(Integer agreementId) {
        this.agreementId = agreementId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getBrokerId() {
        return brokerId;
    }

    public void setBrokerId(Integer brokerId) {
        this.brokerId = brokerId;
    }

    public String getBrokerCode() {
        return brokerCode;
    }

    public void setBrokerCode(String brokerCode) {
        this.brokerCode = brokerCode;
    }

    public String getBrokerName() {
        return brokerName;
    }

    public void setBrokerName(String brokerName) {
        this.brokerName = brokerName;
    }

    public String getAgreementCode() {
        return agreementCode;
    }

    public void setAgreementCode(String agreementCode) {
        this.agreementCode = agreementCode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getTradeType() {
        return tradeType;
    }

    public void setTradeType(String tradeType) {
        this.tradeType = tradeType;
    }

    public String getFeeType() {
        return feeType;
    }

    public void setFeeType(String feeType) {
        this.feeType = feeType;
    }

    public BigDecimal getFeeRate() {
        return feeRate;
    }

    public void setFeeRate(BigDecimal feeRate) {
        this.feeRate = feeRate;
    }

    public Integer getFeeCurrencyId() {
        return feeCurrencyId;
    }

    public void setFeeCurrencyId(Integer feeCurrencyId) {
        this.feeCurrencyId = feeCurrencyId;
    }

    public String getFeeCurrencyCode() {
        return feeCurrencyCode;
    }

    public void setFeeCurrencyCode(String feeCurrencyCode) {
        this.feeCurrencyCode = feeCurrencyCode;
    }

    public Integer getUomId() {
        return uomId;
    }

    public void setUomId(Integer uomId) {
        this.uomId = uomId;
    }

    public String getUomCode() {
        return uomCode;
    }

    public void setUomCode(String uomCode) {
        this.uomCode = uomCode;
    }

    public String getPayPeriod() {
        return payPeriod;
    }

    public void setPayPeriod(String payPeriod) {
        this.payPeriod = payPeriod;
    }

    public Integer getPaymentDueDays() {
        return paymentDueDays;
    }

    public void setPaymentDueDays(Integer paymentDueDays) {
        this.paymentDueDays = paymentDueDays;
    }

    public BigDecimal getMinimumFee() {
        return minimumFee;
    }

    public void setMinimumFee(BigDecimal minimumFee) {
        this.minimumFee = minimumFee;
    }

    public BigDecimal getMaximumFee() {
        return maximumFee;
    }

    public void setMaximumFee(BigDecimal maximumFee) {
        this.maximumFee = maximumFee;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
