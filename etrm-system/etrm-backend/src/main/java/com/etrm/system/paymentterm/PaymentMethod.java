package com.etrm.system.paymentterm;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * dbo.payment_method is served generically via the Tier2 reference-data
 * mechanism, AND was separately read here (read-only) so PaymentTermService
 * can resolve payment_method -> its code for display. Upgraded in place to
 * a full dedicated entity — the frontend's own dedicated Payment Methods
 * page (features/contracts/payment-methods) called /payment-methods
 * expecting a dedicated controller that never existed, 404ing against the
 * real backend. `methodType` is mapped onto the same `type_code` column as
 * `methodCode` (the table has no separate classification column — every
 * live row's type_code, e.g. "WIRE"/"LETTER_OF_CREDIT", already doubles as
 * both an individual method's code and its classification, so this is a
 * deliberate 1:1 alias, not a real second value). `currencyRestriction`/
 * `processingDays` are new nullable columns (V114) — the frontend's own
 * type wanted them but the live table never had them.
 */
@Entity
@Table(name = "payment_method")
@EntityListeners(AuditingEntityListener.class)
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_method_id")
    private Integer paymentMethodId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 30)
    @Column(name = "type_code", nullable = false, length = 30)
    private String typeCode;

    @NotBlank
    @Size(max = 100)
    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;

    @Size(max = 10)
    @Column(name = "currency_restriction", length = 10)
    private String currencyRestriction;

    @Column(name = "processing_days")
    private Short processingDays;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

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

    public Integer getPaymentMethodId() {
        return paymentMethodId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public void setPaymentMethodId(Integer paymentMethodId) {
        this.paymentMethodId = paymentMethodId;
    }

    @JsonProperty("methodCode")
    public String getTypeCode() {
        return typeCode;
    }

    @JsonProperty("methodCode")
    public void setTypeCode(String typeCode) {
        this.typeCode = typeCode;
    }

    @JsonProperty("methodName")
    public String getTypeName() {
        return typeName;
    }

    @JsonProperty("methodName")
    public void setTypeName(String typeName) {
        this.typeName = typeName;
    }

    /** Aliased onto type_code — see class doc comment. */
    @JsonProperty("methodType")
    public String getMethodType() {
        return typeCode;
    }

    @JsonProperty("methodType")
    public void setMethodType(String methodType) {
        this.typeCode = methodType;
    }

    public String getCurrencyRestriction() {
        return currencyRestriction;
    }

    public void setCurrencyRestriction(String currencyRestriction) {
        this.currencyRestriction = currencyRestriction;
    }

    public Short getProcessingDays() {
        return processingDays;
    }

    public void setProcessingDays(Short processingDays) {
        this.processingDays = processingDays;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
