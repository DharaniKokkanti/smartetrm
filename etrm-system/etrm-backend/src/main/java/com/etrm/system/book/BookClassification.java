package com.etrm.system.book;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * dbo.book_classification (V122) — the decoupled dimension-value map that
 * replaced book.commodity_type. A book carries zero or more rows here, one
 * per (dimension, value) pair, instead of the core dbo.book table growing a
 * new column for every classification axis. Only created_at/created_by (no
 * updated columns) — same shape as BookTrader, does not extend
 * AuditableEntity.
 */
@Entity
@Table(name = "book_classification")
public class BookClassification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "book_classification_id")
    private Integer bookClassificationId;

    // V129 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "book_id", nullable = false)
    private Integer bookId;

    @NotNull
    @Column(name = "dimension_id", nullable = false)
    private Integer dimensionId;

    @Transient
    @JsonProperty
    private String dimensionCode;

    @NotBlank
    @Size(max = 50)
    @Column(name = "value_code", nullable = false, length = 50)
    private String valueCode;

    @Size(max = 200)
    @Column(name = "value_label", length = 200)
    private String valueLabel;

    @NotNull
    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Integer getBookClassificationId() {
        return bookClassificationId;
    }

    public void setBookClassificationId(Integer bookClassificationId) {
        this.bookClassificationId = bookClassificationId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getBookId() {
        return bookId;
    }

    public void setBookId(Integer bookId) {
        this.bookId = bookId;
    }

    public Integer getDimensionId() {
        return dimensionId;
    }

    public void setDimensionId(Integer dimensionId) {
        this.dimensionId = dimensionId;
    }

    public String getDimensionCode() {
        return dimensionCode;
    }

    public void setDimensionCode(String dimensionCode) {
        this.dimensionCode = dimensionCode;
    }

    public String getValueCode() {
        return valueCode;
    }

    public void setValueCode(String valueCode) {
        this.valueCode = valueCode;
    }

    public String getValueLabel() {
        return valueLabel;
    }

    public void setValueLabel(String valueLabel) {
        this.valueLabel = valueLabel;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
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
}
