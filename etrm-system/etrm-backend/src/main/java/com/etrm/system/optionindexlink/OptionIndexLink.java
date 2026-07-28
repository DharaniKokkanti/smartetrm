package com.etrm.system.optionindexlink;

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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * dbo.option_index_link (V180) — one row per option index, linking it to the
 * underlying linear index the pricing model reads the forward price from,
 * plus which model prices it (BLACK_76, GARMAN_KOHLHAGEN, SABR,
 * SHIFTED_LOGNORMAL — the last two for markets where negative underlying
 * prices are possible, e.g. power).
 * Both optionPriceIndexId and underlyingPriceIndexId are normal
 * dbo.price_index rows — an option series is still "an index" in this
 * schema's terms; this table only adds the extra linkage a plain
 * price_index row doesn't carry on its own.
 */
@Entity
@Table(name = "option_index_link")
public class OptionIndexLink extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "option_index_link_id")
    private Integer optionIndexLinkId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "option_price_index_id", nullable = false)
    private Integer optionPriceIndexId;

    @Transient
    @JsonProperty
    private String optionIndexCode;

    @Transient
    @JsonProperty
    private String optionIndexName;

    @NotNull
    @Column(name = "underlying_price_index_id", nullable = false)
    private Integer underlyingPriceIndexId;

    @Transient
    @JsonProperty
    private String underlyingIndexCode;

    @Transient
    @JsonProperty
    private String underlyingIndexName;

    @NotBlank
    @Size(max = 30)
    @Column(name = "pricing_model", nullable = false, length = 30)
    private String pricingModel;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 300)
    @Column(name = "notes", length = 300)
    private String notes;

    public Integer getOptionIndexLinkId() {
        return optionIndexLinkId;
    }

    public void setOptionIndexLinkId(Integer optionIndexLinkId) {
        this.optionIndexLinkId = optionIndexLinkId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getOptionPriceIndexId() {
        return optionPriceIndexId;
    }

    public void setOptionPriceIndexId(Integer optionPriceIndexId) {
        this.optionPriceIndexId = optionPriceIndexId;
    }

    public String getOptionIndexCode() {
        return optionIndexCode;
    }

    public void setOptionIndexCode(String optionIndexCode) {
        this.optionIndexCode = optionIndexCode;
    }

    public String getOptionIndexName() {
        return optionIndexName;
    }

    public void setOptionIndexName(String optionIndexName) {
        this.optionIndexName = optionIndexName;
    }

    public Integer getUnderlyingPriceIndexId() {
        return underlyingPriceIndexId;
    }

    public void setUnderlyingPriceIndexId(Integer underlyingPriceIndexId) {
        this.underlyingPriceIndexId = underlyingPriceIndexId;
    }

    public String getUnderlyingIndexCode() {
        return underlyingIndexCode;
    }

    public void setUnderlyingIndexCode(String underlyingIndexCode) {
        this.underlyingIndexCode = underlyingIndexCode;
    }

    public String getUnderlyingIndexName() {
        return underlyingIndexName;
    }

    public void setUnderlyingIndexName(String underlyingIndexName) {
        this.underlyingIndexName = underlyingIndexName;
    }

    public String getPricingModel() {
        return pricingModel;
    }

    public void setPricingModel(String pricingModel) {
        this.pricingModel = pricingModel;
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
