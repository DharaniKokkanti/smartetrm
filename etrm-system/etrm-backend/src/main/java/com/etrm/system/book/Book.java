package com.etrm.system.book;

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
 * dbo.book is a SQL Server system-versioned (temporal) table — valid_from/
 * valid_to/history are maintained automatically by the engine and
 * deliberately left unmapped here (Hibernate ddl-auto=validate only checks
 * declared columns, not that every DB column is mapped).
 *
 * book_type: dbo.book has TWO columns FK'ing the SAME dbo.book_type table —
 * book_type_id (V17's original nullable FK) and book_type (V55 briefly
 * redirected this at dbo.lookup_value, then V85 redirected it BACK onto
 * dbo.book_type — see V85__lookup_category.sql's own comment: "book_type is
 * the one exception among V17's 13 pairs"). This entity maps only book_type
 * (NOT NULL, the one actually enforced) and leaves the redundant
 * book_type_id unmapped. commodity_type similarly FKs a dedicated
 * dbo.commodity_type table (also V85, not lookup_value). Frontend
 * Book.bookType was a stale string enum before this change and is now the
 * numeric commodity_type/book_type id, same convention already used for
 * desk.commodityType.
 */
@Entity
@Table(name = "book")
public class Book extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "book_id")
    private Integer bookId;

    @NotBlank
    @Size(max = 30)
    @Column(name = "book_code", nullable = false, length = 30)
    private String bookCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "book_name", nullable = false, length = 200)
    private String bookName;

    // FK -> dbo.book_type(book_type_id) — see class doc comment.
    @NotNull
    @Column(name = "book_type", nullable = false)
    private Integer bookType;

    @Column(name = "desk_id")
    private Integer deskId;

    @Transient
    @JsonProperty
    private String deskCode;

    @NotNull
    @Column(name = "legal_entity_id", nullable = false)
    private Integer legalEntityId;

    @Transient
    @JsonProperty
    private String legalEntityCode;

    @NotNull
    @Column(name = "responsible_trader_id", nullable = false)
    private Integer responsibleTraderId;

    @Transient
    @JsonProperty
    private String responsibleTraderName;

    // FK -> dbo.commodity_type(commodity_type_id) — see class doc comment.
    @NotNull
    @Column(name = "commodity_type", nullable = false)
    private Integer commodityType;

    @NotNull
    @Column(name = "base_currency_id", nullable = false)
    private Integer baseCurrencyId;

    @Column(name = "position_limit")
    private BigDecimal positionLimit;

    @Column(name = "pnl_limit")
    private BigDecimal pnlLimit;

    @Column(name = "var_limit")
    private BigDecimal varLimit;

    @Column(name = "go_live_date")
    private LocalDate goLiveDate;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getBookId() {
        return bookId;
    }

    public void setBookId(Integer bookId) {
        this.bookId = bookId;
    }

    public String getBookCode() {
        return bookCode;
    }

    public void setBookCode(String bookCode) {
        this.bookCode = bookCode;
    }

    public String getBookName() {
        return bookName;
    }

    public void setBookName(String bookName) {
        this.bookName = bookName;
    }

    public Integer getBookType() {
        return bookType;
    }

    public void setBookType(Integer bookType) {
        this.bookType = bookType;
    }

    public Integer getDeskId() {
        return deskId;
    }

    public void setDeskId(Integer deskId) {
        this.deskId = deskId;
    }

    public String getDeskCode() {
        return deskCode;
    }

    public void setDeskCode(String deskCode) {
        this.deskCode = deskCode;
    }

    public Integer getLegalEntityId() {
        return legalEntityId;
    }

    public void setLegalEntityId(Integer legalEntityId) {
        this.legalEntityId = legalEntityId;
    }

    public String getLegalEntityCode() {
        return legalEntityCode;
    }

    public void setLegalEntityCode(String legalEntityCode) {
        this.legalEntityCode = legalEntityCode;
    }

    public Integer getResponsibleTraderId() {
        return responsibleTraderId;
    }

    public void setResponsibleTraderId(Integer responsibleTraderId) {
        this.responsibleTraderId = responsibleTraderId;
    }

    public String getResponsibleTraderName() {
        return responsibleTraderName;
    }

    public void setResponsibleTraderName(String responsibleTraderName) {
        this.responsibleTraderName = responsibleTraderName;
    }

    public Integer getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(Integer commodityType) {
        this.commodityType = commodityType;
    }

    public Integer getBaseCurrencyId() {
        return baseCurrencyId;
    }

    public void setBaseCurrencyId(Integer baseCurrencyId) {
        this.baseCurrencyId = baseCurrencyId;
    }

    public BigDecimal getPositionLimit() {
        return positionLimit;
    }

    public void setPositionLimit(BigDecimal positionLimit) {
        this.positionLimit = positionLimit;
    }

    public BigDecimal getPnlLimit() {
        return pnlLimit;
    }

    public void setPnlLimit(BigDecimal pnlLimit) {
        this.pnlLimit = pnlLimit;
    }

    public BigDecimal getVarLimit() {
        return varLimit;
    }

    public void setVarLimit(BigDecimal varLimit) {
        this.varLimit = varLimit;
    }

    public LocalDate getGoLiveDate() {
        return goLiveDate;
    }

    public void setGoLiveDate(LocalDate goLiveDate) {
        this.goLiveDate = goLiveDate;
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
}
