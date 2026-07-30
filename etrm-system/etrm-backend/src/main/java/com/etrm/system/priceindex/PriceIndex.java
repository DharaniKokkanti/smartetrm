package com.etrm.system.priceindex;

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

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * commodity_id was dropped by V172 — it was classification/reporting only,
 * never part of the real resolution chain (period -> market_product_link ->
 * price_index_source -> price_index; see period.price_index_id doc below).
 * created_at added by V101 (table had zero audit columns);
 * created_by/updated_at/updated_by added by V149 — see GlAccount.java's
 * doc comment for the general pattern.
 * publicationFrequency/pnodeId/priceType added by V168, publicationFrequency
 * renamed+broadened by V170 (was settlementIntervalType, power-only values
 * DAILY/HOURLY/FIFTEEN_MIN/FIVE_MIN) into a general "how often does this
 * index publish a new value" field for every index — power or not
 * (WEEKLY/MONTHLY/QUARTERLY/BUSINESS_DAY gas/physical assessments included).
 * pnodeId/priceType stay power-specific and null for other indices.
 * priceType (DA/RT) is an index-level attribute, not a per-observation one:
 * a DA and RT series for the same node are different price_index rows
 * (different values, different publication timing), same convention as
 * index_code already encoding identity (DATED_BRENT vs WTI are separate
 * rows too). V170 also added period.price_index_id/fx_index_id — a
 * published curve very often has one price_index PER listed period (e.g.
 * "TTF Month+1" and "TTF Month+2" are different series), so a period, not
 * just a product/market, is what actually resolves to a specific index.
 */
@Entity
@Table(name = "price_index")
@EntityListeners(AuditingEntityListener.class)
public class PriceIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "price_index_id")
    private Integer priceIndexId;

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 30)
    @Column(name = "index_code", nullable = false, length = 30)
    private String indexCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "index_name", nullable = false, length = 200)
    private String indexName;

    @NotNull
    @Column(name = "currency_id", nullable = false)
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @NotNull
    @Column(name = "uom_id", nullable = false)
    private Integer uomId;

    @Transient
    @JsonProperty
    private String uomCode;

    @Size(max = 100)
    @Column(name = "publication_source", length = 100)
    private String publicationSource;

    @Size(max = 100)
    @Column(name = "publication_page", length = 100)
    private String publishedPage;

    @Column(name = "fixing_time")
    private LocalTime fixingTime;

    @Size(max = 50)
    @Column(name = "fixing_timezone", length = 50)
    private String fixingTimezone;

    @NotBlank
    @Size(max = 20)
    @Column(name = "publication_frequency", nullable = false, length = 20)
    private String publicationFrequency = "DAILY";

    @Column(name = "pnode_id")
    private Integer pnodeId;

    // V171 — gas-location counterpart to pnodeId, for location-specific gas
    // indices (Henry Hub, Waha, AECO) tied to a physical pipeline point.
    @Column(name = "pipeline_point_id")
    private Integer pipelinePointId;

    @Size(max = 2)
    @Column(name = "price_type", length = 2)
    private String priceType;

    // V185 — direct listing FK for formula/quote-selection convenience,
    // nullable (an index can genuinely be sourced from >1 listing, e.g.
    // Dated Brent via ICE_BRENT and ICAP_BRENT_OTC — the full sourcing map
    // stays on price_index_source; this is just the primary/quick-pick one,
    // Dharani's explicit call over staying listing-agnostic).
    @Column(name = "market_product_link_id")
    private Integer marketProductLinkId;

    @Transient
    @JsonProperty
    private String marketCode;

    @Transient
    @JsonProperty
    private String productCode;

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

    public Integer getPriceIndexId() {
        return priceIndexId;
    }

    public void setPriceIndexId(Integer priceIndexId) {
        this.priceIndexId = priceIndexId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getIndexCode() {
        return indexCode;
    }

    public void setIndexCode(String indexCode) {
        this.indexCode = indexCode;
    }

    public String getIndexName() {
        return indexName;
    }

    public void setIndexName(String indexName) {
        this.indexName = indexName;
    }

    public Integer getCurrencyId() {
        return currencyId;
    }

    public void setCurrencyId(Integer currencyId) {
        this.currencyId = currencyId;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
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

    public String getPublicationSource() {
        return publicationSource;
    }

    public void setPublicationSource(String publicationSource) {
        this.publicationSource = publicationSource;
    }

    public String getPublishedPage() {
        return publishedPage;
    }

    public void setPublishedPage(String publishedPage) {
        this.publishedPage = publishedPage;
    }

    public LocalTime getFixingTime() {
        return fixingTime;
    }

    public void setFixingTime(LocalTime fixingTime) {
        this.fixingTime = fixingTime;
    }

    public String getFixingTimezone() {
        return fixingTimezone;
    }

    public void setFixingTimezone(String fixingTimezone) {
        this.fixingTimezone = fixingTimezone;
    }

    public String getPublicationFrequency() {
        return publicationFrequency;
    }

    public void setPublicationFrequency(String publicationFrequency) {
        this.publicationFrequency = publicationFrequency;
    }

    public Integer getPnodeId() {
        return pnodeId;
    }

    public void setPnodeId(Integer pnodeId) {
        this.pnodeId = pnodeId;
    }

    public Integer getPipelinePointId() {
        return pipelinePointId;
    }

    public void setPipelinePointId(Integer pipelinePointId) {
        this.pipelinePointId = pipelinePointId;
    }

    public String getPriceType() {
        return priceType;
    }

    public void setPriceType(String priceType) {
        this.priceType = priceType;
    }

    public Integer getMarketProductLinkId() {
        return marketProductLinkId;
    }

    public void setMarketProductLinkId(Integer marketProductLinkId) {
        this.marketProductLinkId = marketProductLinkId;
    }

    public String getMarketCode() {
        return marketCode;
    }

    public void setMarketCode(String marketCode) {
        this.marketCode = marketCode;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
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
