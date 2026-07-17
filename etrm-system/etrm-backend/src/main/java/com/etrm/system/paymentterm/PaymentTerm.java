package com.etrm.system.paymentterm;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * dbo.payment_term is a dedicated (non-Tier2) entity with its own controller —
 * upgraded in place from the earlier read-only reader used by
 * CpCommercialTermsService (still callable via getPaymentTermId()/getTermName()).
 * base_date_event/days_basis/business_day_convention remain plain CHECK-backed
 * strings (not FKs), matching the live schema and the frontend's existing
 * string-union types.
 */
@Entity
@Table(name = "payment_term")
public class PaymentTerm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_term_id")
    private Integer paymentTermId;

    @NotBlank
    @Size(max = 30)
    @Column(name = "term_code", nullable = false, length = 30)
    private String termCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "term_name", nullable = false, length = 200)
    private String termName;

    @NotBlank
    @Size(max = 30)
    @Column(name = "base_date_event", nullable = false, length = 30)
    private String baseDateEvent;

    @NotNull
    @Column(name = "month_offset", nullable = false)
    private Short monthOffset;

    @NotNull
    @Column(name = "offset_days", nullable = false)
    private Short offsetDays;

    @NotBlank
    @Size(max = 20)
    @Column(name = "days_basis", nullable = false, length = 20)
    private String daysBasis;

    @Column(name = "fixed_day_of_month")
    private Short fixedDayOfMonth;

    @NotBlank
    @Size(max = 20)
    @Column(name = "business_day_convention", nullable = false, length = 20)
    private String businessDayConvention;

    @Column(name = "calendar_id")
    private Integer calendarId;

    @Transient
    @JsonProperty
    private String calendarCode;

    @Column(name = "discount_days")
    private Short discountDays;

    @Column(name = "discount_pct", precision = 7, scale = 4)
    private BigDecimal discountPct;

    @NotNull
    @Column(name = "payment_method", nullable = false)
    private Integer paymentMethod;

    @Transient
    @JsonProperty
    private String paymentMethodCode;

    @Column(name = "invoice_lead_days")
    private Short invoiceLeadDays;

    @NotNull
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Integer getPaymentTermId() {
        return paymentTermId;
    }

    public void setPaymentTermId(Integer paymentTermId) {
        this.paymentTermId = paymentTermId;
    }

    public String getTermCode() {
        return termCode;
    }

    public void setTermCode(String termCode) {
        this.termCode = termCode;
    }

    public String getTermName() {
        return termName;
    }

    public void setTermName(String termName) {
        this.termName = termName;
    }

    public String getBaseDateEvent() {
        return baseDateEvent;
    }

    public void setBaseDateEvent(String baseDateEvent) {
        this.baseDateEvent = baseDateEvent;
    }

    public Short getMonthOffset() {
        return monthOffset;
    }

    public void setMonthOffset(Short monthOffset) {
        this.monthOffset = monthOffset;
    }

    public Short getOffsetDays() {
        return offsetDays;
    }

    public void setOffsetDays(Short offsetDays) {
        this.offsetDays = offsetDays;
    }

    public String getDaysBasis() {
        return daysBasis;
    }

    public void setDaysBasis(String daysBasis) {
        this.daysBasis = daysBasis;
    }

    public Short getFixedDayOfMonth() {
        return fixedDayOfMonth;
    }

    public void setFixedDayOfMonth(Short fixedDayOfMonth) {
        this.fixedDayOfMonth = fixedDayOfMonth;
    }

    public String getBusinessDayConvention() {
        return businessDayConvention;
    }

    public void setBusinessDayConvention(String businessDayConvention) {
        this.businessDayConvention = businessDayConvention;
    }

    public Integer getCalendarId() {
        return calendarId;
    }

    public void setCalendarId(Integer calendarId) {
        this.calendarId = calendarId;
    }

    public String getCalendarCode() {
        return calendarCode;
    }

    public void setCalendarCode(String calendarCode) {
        this.calendarCode = calendarCode;
    }

    public Short getDiscountDays() {
        return discountDays;
    }

    public void setDiscountDays(Short discountDays) {
        this.discountDays = discountDays;
    }

    public BigDecimal getDiscountPct() {
        return discountPct;
    }

    public void setDiscountPct(BigDecimal discountPct) {
        this.discountPct = discountPct;
    }

    public Integer getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(Integer paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentMethodCode() {
        return paymentMethodCode;
    }

    public void setPaymentMethodCode(String paymentMethodCode) {
        this.paymentMethodCode = paymentMethodCode;
    }

    public Short getInvoiceLeadDays() {
        return invoiceLeadDays;
    }

    public void setInvoiceLeadDays(Short invoiceLeadDays) {
        this.invoiceLeadDays = invoiceLeadDays;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
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
}
