package com.etrm.system.pricingrule;

import com.etrm.system.common.AuditableEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
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

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * dbo.pricing_rule — the most complex table in this batch (~40 real columns
 * + 2 SQL Server system-versioning columns deliberately excluded below:
 * valid_from_sys/valid_to_sys). The live table is SIGNIFICANTLY richer than
 * the frontend's PricingRule type; every real column is mapped here for
 * persistence integrity even though several (market_id, incoterm_id,
 * primary_trigger_id, fallback_trigger_id, window_rule_id, index_currency_id,
 * trade_currency_id, fx_index_id, invoice_trigger_id, invoice_calendar_id,
 * final_invoice_trigger_id, and the fallback/late-pricing/provisional/
 * invoice-timing string columns) have NO corresponding frontend field and
 * are therefore write-through only (accepted on create/update, returned as
 * plain ids/strings, never hydrated to a display code) — the frontend simply
 * never sends or reads them today.
 *
 * KNOWN FRONTEND/DB MISMATCHES (see PricingRuleService for handling):
 *  - differentialUomCode, pricingCalendarCode, publicationSource,
 *    balmoExchange, balmoSeries, balmoTickSize: frontend fields with NO
 *    backing DB column at all. Exposed as always-null @Transient fields;
 *    silently ignored on input (nothing to persist them into).
 *  - differentialAmount (frontend) <-> differential_value (DB column):
 *    JSON name intentionally differs from the column name.
 *  - rounding (frontend) <-> rounding_convention (DB column): JSON name
 *    differs. Frontend's ROUNDING_RULES const (NONE/ROUND_2DP/ROUND_3DP/
 *    ROUND_4DP/ROUND_UP/ROUND_DOWN) does NOT match the live CHECK
 *    constraint's actual values (DOWN/UP/TRUNCATE/BANKER/STANDARD) — the
 *    raw DB value is passed through as-is, untranslated. This is a
 *    pre-existing frontend/DB vocabulary mismatch, not something papered
 *    over here.
 *  - formulaExpression, averagingMethod: NOT pricing_rule columns at all;
 *    best-effort sourced from the linked formula_template row (via
 *    formula_template_id) when present — formulaExpression from that row's
 *    formula_expression, averagingMethod from its averaging_type (a
 *    best-effort guess, since pricing_rule has no averaging column of its
 *    own and formula_template's averaging_type vocabulary
 *    (DAILY/WEIGHTED_DAILY/MONTHLY_AVERAGE/NONE) doesn't match the
 *    frontend's AveragingMethod union (ARITHMETIC/WEIGHTED/ASIAN) either —
 *    passed through as-is same as rounding.
 *  - pricingType: resolved from pricing_type_id via dbo.lookup.PricingType.
 */
@Entity
@Table(name = "pricing_rule")
public class PricingRule extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pricing_rule_id")
    private Integer pricingRuleId;

    @NotNull
    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Column(name = "market_id")
    private Integer marketId;

    @Column(name = "incoterm_id")
    private Integer incotermId;

    @NotNull
    @Column(name = "pricing_type_id", nullable = false)
    private Integer pricingTypeId;

    @Transient
    @JsonProperty
    private String pricingType;

    @Column(name = "price_index_id")
    private Integer priceIndexId;

    @Transient
    @JsonProperty
    private String priceIndexCode;

    @Column(name = "formula_template_id")
    private Integer formulaTemplateId;

    @Transient
    @JsonProperty
    private String formulaExpression;

    @Transient
    @JsonProperty
    private String averagingMethod;

    @Column(name = "differential_value", precision = 18, scale = 6)
    private BigDecimal differentialValue;

    @Column(name = "differential_currency_id")
    private Integer differentialCurrencyId;

    @Transient
    @JsonProperty
    private String differentialCurrencyCode;

    // Frontend field with no backing DB column — always null, see class doc.
    @Transient
    @JsonProperty
    private final String differentialUomCode = null;

    @Column(name = "primary_trigger_id")
    private Integer primaryTriggerId;

    @Column(name = "fallback_trigger_id")
    private Integer fallbackTriggerId;

    @Column(name = "fallback_deadline_days")
    private Short fallbackDeadlineDays;

    @Size(max = 20)
    @Column(name = "fallback_deadline_basis", length = 20)
    private String fallbackDeadlineBasis;

    @Column(name = "window_rule_id")
    private Integer windowRuleId;

    @Column(name = "index_currency_id")
    private Integer indexCurrencyId;

    @Column(name = "trade_currency_id")
    private Integer tradeCurrencyId;

    @NotNull
    @Column(name = "fx_conversion_required", nullable = false)
    private Boolean fxConversionRequired = false;

    @Size(max = 20)
    @Column(name = "fx_fixing_type", length = 20)
    private String fxFixingType;

    @Column(name = "fx_index_id")
    private Integer fxIndexId;

    @Size(max = 20)
    @Column(name = "late_pricing_rule", length = 20)
    private String latePricingRule;

    @Size(max = 20)
    @Column(name = "provisional_basis", length = 20)
    private String provisionalBasis;

    @NotNull
    @Column(name = "price_decimal_places", nullable = false)
    private Short priceDecimalPlaces;

    @NotNull
    @Column(name = "quantity_decimal_places", nullable = false)
    private Short quantityDecimalPlaces;

    @NotNull
    @Column(name = "value_decimal_places", nullable = false)
    private Short valueDecimalPlaces;

    @NotBlank
    @Size(max = 20)
    @Column(name = "rounding_convention", nullable = false, length = 20)
    private String roundingConvention;

    @Column(name = "invoice_trigger_id")
    private Integer invoiceTriggerId;

    @NotNull
    @Column(name = "invoice_timing_days", nullable = false)
    private Short invoiceTimingDays;

    @NotBlank
    @Size(max = 10)
    @Column(name = "invoice_timing_basis", nullable = false, length = 10)
    private String invoiceTimingBasis;

    @Column(name = "invoice_calendar_id")
    private Integer invoiceCalendarId;

    @NotNull
    @Column(name = "requires_final_invoice", nullable = false)
    private Boolean requiresFinalInvoice = false;

    @Column(name = "final_invoice_trigger_id")
    private Integer finalInvoiceTriggerId;

    @NotBlank
    @Size(max = 200)
    @Column(name = "rule_name", nullable = false, length = 200)
    private String ruleName;

    @NotBlank
    @Size(max = 30)
    @Column(name = "rule_code", nullable = false, length = 30)
    private String ruleCode;

    @NotNull
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

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

    @Size(max = 40)
    @Column(name = "tas_exchange", length = 40)
    private String tasExchange;

    @Size(max = 20)
    @Column(name = "tas_contract_series", length = 20)
    private String tasContractSeries;

    @Column(name = "tas_tick_size", precision = 12, scale = 6)
    private BigDecimal tasTickSize;

    // Frontend fields with no backing DB column — always null, see class doc.
    @Transient
    @JsonProperty
    private final String pricingCalendarCode = null;

    @Transient
    @JsonProperty
    private final String publicationSource = null;

    @Transient
    @JsonProperty
    private final String balmoExchange = null;

    @Transient
    @JsonProperty
    private final String balmoSeries = null;

    @Transient
    @JsonProperty
    private final BigDecimal balmoTickSize = null;

    public Integer getPricingRuleId() {
        return pricingRuleId;
    }

    public void setPricingRuleId(Integer pricingRuleId) {
        this.pricingRuleId = pricingRuleId;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public Integer getMarketId() {
        return marketId;
    }

    public void setMarketId(Integer marketId) {
        this.marketId = marketId;
    }

    public Integer getIncotermId() {
        return incotermId;
    }

    public void setIncotermId(Integer incotermId) {
        this.incotermId = incotermId;
    }

    public Integer getPricingTypeId() {
        return pricingTypeId;
    }

    public void setPricingTypeId(Integer pricingTypeId) {
        this.pricingTypeId = pricingTypeId;
    }

    public String getPricingType() {
        return pricingType;
    }

    public void setPricingType(String pricingType) {
        this.pricingType = pricingType;
    }

    public Integer getPriceIndexId() {
        return priceIndexId;
    }

    public void setPriceIndexId(Integer priceIndexId) {
        this.priceIndexId = priceIndexId;
    }

    public String getPriceIndexCode() {
        return priceIndexCode;
    }

    public void setPriceIndexCode(String priceIndexCode) {
        this.priceIndexCode = priceIndexCode;
    }

    public Integer getFormulaTemplateId() {
        return formulaTemplateId;
    }

    public void setFormulaTemplateId(Integer formulaTemplateId) {
        this.formulaTemplateId = formulaTemplateId;
    }

    public String getFormulaExpression() {
        return formulaExpression;
    }

    public void setFormulaExpression(String formulaExpression) {
        this.formulaExpression = formulaExpression;
    }

    public String getAveragingMethod() {
        return averagingMethod;
    }

    public void setAveragingMethod(String averagingMethod) {
        this.averagingMethod = averagingMethod;
    }

    @JsonProperty("differentialAmount")
    public BigDecimal getDifferentialValue() {
        return differentialValue;
    }

    @JsonProperty("differentialAmount")
    public void setDifferentialValue(BigDecimal differentialValue) {
        this.differentialValue = differentialValue;
    }

    public Integer getDifferentialCurrencyId() {
        return differentialCurrencyId;
    }

    public void setDifferentialCurrencyId(Integer differentialCurrencyId) {
        this.differentialCurrencyId = differentialCurrencyId;
    }

    public String getDifferentialCurrencyCode() {
        return differentialCurrencyCode;
    }

    public void setDifferentialCurrencyCode(String differentialCurrencyCode) {
        this.differentialCurrencyCode = differentialCurrencyCode;
    }

    public String getDifferentialUomCode() {
        return differentialUomCode;
    }

    public Integer getPrimaryTriggerId() {
        return primaryTriggerId;
    }

    public void setPrimaryTriggerId(Integer primaryTriggerId) {
        this.primaryTriggerId = primaryTriggerId;
    }

    public Integer getFallbackTriggerId() {
        return fallbackTriggerId;
    }

    public void setFallbackTriggerId(Integer fallbackTriggerId) {
        this.fallbackTriggerId = fallbackTriggerId;
    }

    public Short getFallbackDeadlineDays() {
        return fallbackDeadlineDays;
    }

    public void setFallbackDeadlineDays(Short fallbackDeadlineDays) {
        this.fallbackDeadlineDays = fallbackDeadlineDays;
    }

    public String getFallbackDeadlineBasis() {
        return fallbackDeadlineBasis;
    }

    public void setFallbackDeadlineBasis(String fallbackDeadlineBasis) {
        this.fallbackDeadlineBasis = fallbackDeadlineBasis;
    }

    public Integer getWindowRuleId() {
        return windowRuleId;
    }

    public void setWindowRuleId(Integer windowRuleId) {
        this.windowRuleId = windowRuleId;
    }

    public Integer getIndexCurrencyId() {
        return indexCurrencyId;
    }

    public void setIndexCurrencyId(Integer indexCurrencyId) {
        this.indexCurrencyId = indexCurrencyId;
    }

    public Integer getTradeCurrencyId() {
        return tradeCurrencyId;
    }

    public void setTradeCurrencyId(Integer tradeCurrencyId) {
        this.tradeCurrencyId = tradeCurrencyId;
    }

    public Boolean getFxConversionRequired() {
        return fxConversionRequired;
    }

    public void setFxConversionRequired(Boolean fxConversionRequired) {
        this.fxConversionRequired = fxConversionRequired;
    }

    public String getFxFixingType() {
        return fxFixingType;
    }

    public void setFxFixingType(String fxFixingType) {
        this.fxFixingType = fxFixingType;
    }

    public Integer getFxIndexId() {
        return fxIndexId;
    }

    public void setFxIndexId(Integer fxIndexId) {
        this.fxIndexId = fxIndexId;
    }

    public String getLatePricingRule() {
        return latePricingRule;
    }

    public void setLatePricingRule(String latePricingRule) {
        this.latePricingRule = latePricingRule;
    }

    public String getProvisionalBasis() {
        return provisionalBasis;
    }

    public void setProvisionalBasis(String provisionalBasis) {
        this.provisionalBasis = provisionalBasis;
    }

    public Short getPriceDecimalPlaces() {
        return priceDecimalPlaces;
    }

    public void setPriceDecimalPlaces(Short priceDecimalPlaces) {
        this.priceDecimalPlaces = priceDecimalPlaces;
    }

    public Short getQuantityDecimalPlaces() {
        return quantityDecimalPlaces;
    }

    public void setQuantityDecimalPlaces(Short quantityDecimalPlaces) {
        this.quantityDecimalPlaces = quantityDecimalPlaces;
    }

    public Short getValueDecimalPlaces() {
        return valueDecimalPlaces;
    }

    public void setValueDecimalPlaces(Short valueDecimalPlaces) {
        this.valueDecimalPlaces = valueDecimalPlaces;
    }

    @JsonProperty("rounding")
    public String getRoundingConvention() {
        return roundingConvention;
    }

    @JsonProperty("rounding")
    public void setRoundingConvention(String roundingConvention) {
        this.roundingConvention = roundingConvention;
    }

    public Integer getInvoiceTriggerId() {
        return invoiceTriggerId;
    }

    public void setInvoiceTriggerId(Integer invoiceTriggerId) {
        this.invoiceTriggerId = invoiceTriggerId;
    }

    public Short getInvoiceTimingDays() {
        return invoiceTimingDays;
    }

    public void setInvoiceTimingDays(Short invoiceTimingDays) {
        this.invoiceTimingDays = invoiceTimingDays;
    }

    public String getInvoiceTimingBasis() {
        return invoiceTimingBasis;
    }

    public void setInvoiceTimingBasis(String invoiceTimingBasis) {
        this.invoiceTimingBasis = invoiceTimingBasis;
    }

    public Integer getInvoiceCalendarId() {
        return invoiceCalendarId;
    }

    public void setInvoiceCalendarId(Integer invoiceCalendarId) {
        this.invoiceCalendarId = invoiceCalendarId;
    }

    public Boolean getRequiresFinalInvoice() {
        return requiresFinalInvoice;
    }

    public void setRequiresFinalInvoice(Boolean requiresFinalInvoice) {
        this.requiresFinalInvoice = requiresFinalInvoice;
    }

    public Integer getFinalInvoiceTriggerId() {
        return finalInvoiceTriggerId;
    }

    public void setFinalInvoiceTriggerId(Integer finalInvoiceTriggerId) {
        this.finalInvoiceTriggerId = finalInvoiceTriggerId;
    }

    public String getRuleName() {
        return ruleName;
    }

    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
    }

    public String getRuleCode() {
        return ruleCode;
    }

    public void setRuleCode(String ruleCode) {
        this.ruleCode = ruleCode;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getTasExchange() {
        return tasExchange;
    }

    public void setTasExchange(String tasExchange) {
        this.tasExchange = tasExchange;
    }

    public String getTasContractSeries() {
        return tasContractSeries;
    }

    public void setTasContractSeries(String tasContractSeries) {
        this.tasContractSeries = tasContractSeries;
    }

    public BigDecimal getTasTickSize() {
        return tasTickSize;
    }

    public void setTasTickSize(BigDecimal tasTickSize) {
        this.tasTickSize = tasTickSize;
    }

    public String getPricingCalendarCode() {
        return pricingCalendarCode;
    }

    public String getPublicationSource() {
        return publicationSource;
    }

    public String getBalmoExchange() {
        return balmoExchange;
    }

    public String getBalmoSeries() {
        return balmoSeries;
    }

    public BigDecimal getBalmoTickSize() {
        return balmoTickSize;
    }
}
