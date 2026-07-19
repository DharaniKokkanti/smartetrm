package com.etrm.system.collateral;

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

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * dbo.collateral.eligible_value is a SQL Server COMPUTED column
 * (market_value * (1 - haircut_pct/100)) — deliberately left unmapped, an
 * entity can't write to it and the frontend doesn't use it either.
 */
@Entity
@Table(name = "collateral")
public class Collateral extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "collateral_id")
    private Integer collateralId;

    // V128 — optimistic locking (see LegalEntity.rowVersion doc comment).
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "collateral_type_id", nullable = false)
    private Integer collateralTypeId;

    @Transient
    @JsonProperty
    private String collateralTypeName;

    @NotBlank
    @Column(name = "direction", nullable = false, length = 10)
    private String direction;

    @NotBlank
    @Column(name = "secured_entity_type", nullable = false, length = 20)
    private String securedEntityType;

    @NotNull
    @Column(name = "secured_entity_id", nullable = false)
    private Integer securedEntityId;

    @NotNull
    @Column(name = "legal_entity_id", nullable = false)
    private Integer legalEntityId;

    @Transient
    @JsonProperty
    private String legalEntityName;

    @Column(name = "counterparty_id")
    private Integer counterpartyId;

    @Transient
    @JsonProperty
    private String counterpartyName;

    @NotNull
    @Column(name = "currency_id", nullable = false)
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @NotNull
    @Column(name = "face_value", nullable = false)
    private BigDecimal faceValue;

    @Column(name = "market_value")
    private BigDecimal marketValue;

    @NotNull
    @Column(name = "haircut_pct", nullable = false)
    private BigDecimal haircutPct = BigDecimal.ZERO;

    @Size(max = 12)
    @Column(name = "instrument_isin", length = 12)
    private String instrumentIsin;

    @Size(max = 200)
    @Column(name = "instrument_desc", length = 200)
    private String instrumentDesc;

    @Column(name = "lc_id")
    private Integer lcId;

    @Column(name = "bg_id")
    private Integer bgId;

    @NotNull
    @Column(name = "posting_date", nullable = false)
    private LocalDate postingDate;

    @Column(name = "maturity_date")
    private LocalDate maturityDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @NotBlank
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "document_store_id")
    private Integer documentStoreId;

    @Size(max = 300)
    @Column(name = "notes", length = 300)
    private String notes;

    public Integer getCollateralId() {
        return collateralId;
    }

    public void setCollateralId(Integer collateralId) {
        this.collateralId = collateralId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getCollateralTypeId() {
        return collateralTypeId;
    }

    public void setCollateralTypeId(Integer collateralTypeId) {
        this.collateralTypeId = collateralTypeId;
    }

    public String getCollateralTypeName() {
        return collateralTypeName;
    }

    public void setCollateralTypeName(String collateralTypeName) {
        this.collateralTypeName = collateralTypeName;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public String getSecuredEntityType() {
        return securedEntityType;
    }

    public void setSecuredEntityType(String securedEntityType) {
        this.securedEntityType = securedEntityType;
    }

    public Integer getSecuredEntityId() {
        return securedEntityId;
    }

    public void setSecuredEntityId(Integer securedEntityId) {
        this.securedEntityId = securedEntityId;
    }

    public Integer getLegalEntityId() {
        return legalEntityId;
    }

    public void setLegalEntityId(Integer legalEntityId) {
        this.legalEntityId = legalEntityId;
    }

    public String getLegalEntityName() {
        return legalEntityName;
    }

    public void setLegalEntityName(String legalEntityName) {
        this.legalEntityName = legalEntityName;
    }

    public Integer getCounterpartyId() {
        return counterpartyId;
    }

    public void setCounterpartyId(Integer counterpartyId) {
        this.counterpartyId = counterpartyId;
    }

    public String getCounterpartyName() {
        return counterpartyName;
    }

    public void setCounterpartyName(String counterpartyName) {
        this.counterpartyName = counterpartyName;
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

    public BigDecimal getFaceValue() {
        return faceValue;
    }

    public void setFaceValue(BigDecimal faceValue) {
        this.faceValue = faceValue;
    }

    public BigDecimal getMarketValue() {
        return marketValue;
    }

    public void setMarketValue(BigDecimal marketValue) {
        this.marketValue = marketValue;
    }

    public BigDecimal getHaircutPct() {
        return haircutPct;
    }

    public void setHaircutPct(BigDecimal haircutPct) {
        this.haircutPct = haircutPct;
    }

    public String getInstrumentIsin() {
        return instrumentIsin;
    }

    public void setInstrumentIsin(String instrumentIsin) {
        this.instrumentIsin = instrumentIsin;
    }

    public String getInstrumentDesc() {
        return instrumentDesc;
    }

    public void setInstrumentDesc(String instrumentDesc) {
        this.instrumentDesc = instrumentDesc;
    }

    public Integer getLcId() {
        return lcId;
    }

    public void setLcId(Integer lcId) {
        this.lcId = lcId;
    }

    public Integer getBgId() {
        return bgId;
    }

    public void setBgId(Integer bgId) {
        this.bgId = bgId;
    }

    public LocalDate getPostingDate() {
        return postingDate;
    }

    public void setPostingDate(LocalDate postingDate) {
        this.postingDate = postingDate;
    }

    public LocalDate getMaturityDate() {
        return maturityDate;
    }

    public void setMaturityDate(LocalDate maturityDate) {
        this.maturityDate = maturityDate;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getDocumentStoreId() {
        return documentStoreId;
    }

    public void setDocumentStoreId(Integer documentStoreId) {
        this.documentStoreId = documentStoreId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
