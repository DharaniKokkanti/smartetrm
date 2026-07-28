package com.etrm.system.volatilitypoint;

import com.etrm.system.common.AuditableEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * dbo.volatility_point (V180) — one implied-volatility quote: which option
 * index (optionIndexLinkId), which expiry/tenor (periodId), which
 * strike/moneyness point, on which date, from which source.
 * moneynessLabel carries either a delta-style bucket (ATM, 25D_PUT,
 * 25D_CALL) or a literal strike label; strikePrice is only populated when
 * the point is strike-based rather than delta-based — a market quotes one
 * convention or the other, not always both.
 */
@Entity
@Table(name = "volatility_point")
public class VolatilityPoint extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "volatility_point_id")
    private Integer volatilityPointId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "option_index_link_id", nullable = false)
    private Integer optionIndexLinkId;

    @Transient
    @JsonProperty
    private String optionIndexCode;

    @NotNull
    @Column(name = "period_id", nullable = false)
    private Long periodId;

    @Transient
    @JsonProperty
    private String periodCode;

    @NotBlank
    @Size(max = 20)
    @Column(name = "moneyness_label", nullable = false, length = 20)
    private String moneynessLabel;

    @Column(name = "strike_price", precision = 18, scale = 6)
    private BigDecimal strikePrice;

    @NotNull
    @Column(name = "quote_date", nullable = false)
    private LocalDate quoteDate;

    @NotNull
    @DecimalMin(value = "0", inclusive = true)
    @Column(name = "implied_volatility", nullable = false, precision = 9, scale = 6)
    private BigDecimal impliedVolatility;

    @NotNull
    @Column(name = "price_source_id", nullable = false)
    private Integer priceSourceId;

    @Transient
    @JsonProperty
    private String sourceCode;

    @NotNull
    @Column(name = "is_confirmed", nullable = false)
    private Boolean isConfirmed = false;

    @Size(max = 300)
    @Column(name = "notes", length = 300)
    private String notes;

    public Integer getVolatilityPointId() {
        return volatilityPointId;
    }

    public void setVolatilityPointId(Integer volatilityPointId) {
        this.volatilityPointId = volatilityPointId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getOptionIndexLinkId() {
        return optionIndexLinkId;
    }

    public void setOptionIndexLinkId(Integer optionIndexLinkId) {
        this.optionIndexLinkId = optionIndexLinkId;
    }

    public String getOptionIndexCode() {
        return optionIndexCode;
    }

    public void setOptionIndexCode(String optionIndexCode) {
        this.optionIndexCode = optionIndexCode;
    }

    public Long getPeriodId() {
        return periodId;
    }

    public void setPeriodId(Long periodId) {
        this.periodId = periodId;
    }

    public String getPeriodCode() {
        return periodCode;
    }

    public void setPeriodCode(String periodCode) {
        this.periodCode = periodCode;
    }

    public String getMoneynessLabel() {
        return moneynessLabel;
    }

    public void setMoneynessLabel(String moneynessLabel) {
        this.moneynessLabel = moneynessLabel;
    }

    public BigDecimal getStrikePrice() {
        return strikePrice;
    }

    public void setStrikePrice(BigDecimal strikePrice) {
        this.strikePrice = strikePrice;
    }

    public LocalDate getQuoteDate() {
        return quoteDate;
    }

    public void setQuoteDate(LocalDate quoteDate) {
        this.quoteDate = quoteDate;
    }

    public BigDecimal getImpliedVolatility() {
        return impliedVolatility;
    }

    public void setImpliedVolatility(BigDecimal impliedVolatility) {
        this.impliedVolatility = impliedVolatility;
    }

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

    public Boolean getIsConfirmed() {
        return isConfirmed;
    }

    public void setIsConfirmed(Boolean isConfirmed) {
        this.isConfirmed = isConfirmed;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
