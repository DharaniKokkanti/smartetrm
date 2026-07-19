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
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

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
 * book_type_id unmapped. Frontend Book.bookType was a stale string enum
 * before this change and is now the numeric book_type id, same convention
 * already used for desk.commodityType.
 *
 * commodity_type (V85's dedicated dbo.commodity_type FK) was dropped from
 * this table in V122 — a book's commodity classification (and any future
 * classification axis) now lives in dbo.book_classification instead, so the
 * core book table never grows a new commodity/physical-attribute column
 * again. See BookClassification/BookClassificationDimension.
 *
 * V123 collapsed dbo.desk into this table and replaced book_role (V122's
 * TRADING/CONSOLIDATION binary) with two columns: bookLevelTypeId (FK ->
 * dbo.book_level_type — DESK/STRATEGY/TRADING_BOOK, same no-dedicated-entity
 * treatment as bookType/dbo.book_type, just a plain Integer here) says WHAT
 * KIND of hierarchy node this row is; isLeafNode says whether it can hold
 * direct trade/cost/assay postings, independent of level type so that check
 * stays a single boolean rather than an IN-list. dbo.legal_entity is
 * deliberately NOT part of this tree — it keeps its own table and its own
 * parent_entity_id corporate-ownership hierarchy (V62); legalEntityId below
 * is unchanged from before.
 */
@Entity
@Table(name = "book")
public class Book extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "book_id")
    private Integer bookId;

    // V127 — optimistic locking, see LegalEntity.rowVersion for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

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

    // FK -> dbo.book_level_type(level_type_id) (V123) — DESK/STRATEGY/TRADING_BOOK.
    @NotNull
    @Column(name = "book_level_type_id", nullable = false)
    private Integer bookLevelTypeId;

    // Can this row hold direct trade/cost/assay postings? Independent of
    // bookLevelTypeId (V123) — supersedes book_role.
    @NotNull
    @Column(name = "is_leaf_node", nullable = false)
    private Boolean isLeafNode = false;

    @NotNull
    @Column(name = "legal_entity_id", nullable = false)
    private Integer legalEntityId;

    @Transient
    @JsonProperty
    private String legalEntityCode;

    // FK -> dbo.book(book_id), self-referencing, nullable, arbitrary depth
    // (V119). Cycle prevention and depth limits enforced in BookService —
    // SQL Server can't express recursive integrity in a CHECK constraint.
    @Column(name = "parent_book_id")
    private Integer parentBookId;

    @Transient
    @JsonProperty
    private String parentBookCode;

    // Denormalized display of dbo.book_trader (V119) rows for this book —
    // not persisted, populated by BookService.
    @Transient
    @JsonProperty
    private List<BookTraderView> traders;

    @Column(name = "archived_at")
    private LocalDate archivedAt;

    @Size(max = 200)
    @Column(name = "archived_reason", length = 200)
    private String archivedReason;

    // Denormalized display of dbo.book_classification (V122) rows for this
    // book — not persisted, populated by BookService.
    @Transient
    @JsonProperty
    private List<BookClassificationView> classifications;

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

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
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

    public Integer getBookLevelTypeId() {
        return bookLevelTypeId;
    }

    public void setBookLevelTypeId(Integer bookLevelTypeId) {
        this.bookLevelTypeId = bookLevelTypeId;
    }

    public Boolean getIsLeafNode() {
        return isLeafNode;
    }

    public void setIsLeafNode(Boolean isLeafNode) {
        this.isLeafNode = isLeafNode;
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

    public Integer getParentBookId() {
        return parentBookId;
    }

    public void setParentBookId(Integer parentBookId) {
        this.parentBookId = parentBookId;
    }

    public String getParentBookCode() {
        return parentBookCode;
    }

    public void setParentBookCode(String parentBookCode) {
        this.parentBookCode = parentBookCode;
    }

    public List<BookTraderView> getTraders() {
        return traders;
    }

    public void setTraders(List<BookTraderView> traders) {
        this.traders = traders;
    }

    public LocalDate getArchivedAt() {
        return archivedAt;
    }

    public void setArchivedAt(LocalDate archivedAt) {
        this.archivedAt = archivedAt;
    }

    public String getArchivedReason() {
        return archivedReason;
    }

    public void setArchivedReason(String archivedReason) {
        this.archivedReason = archivedReason;
    }

    public List<BookClassificationView> getClassifications() {
        return classifications;
    }

    public void setClassifications(List<BookClassificationView> classifications) {
        this.classifications = classifications;
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
