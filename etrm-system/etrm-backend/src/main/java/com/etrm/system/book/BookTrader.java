package com.etrm.system.book;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * dbo.book_trader (V119) — replaces book.responsible_trader_id with a join
 * table so a book can be shared across several traders (PRIMARY/SECONDARY/
 * BACKUP).
 *
 * V144 — created_at/created_by upgraded to real @CreatedDate/@CreatedBy
 * JPA-auditing fields (were plain @Column + @PrePersist), and
 * updated_at/updated_by added, matching GlAccount's shape.
 */
@Entity
@Table(name = "book_trader")
@EntityListeners(AuditingEntityListener.class)
public class BookTrader {

    @EmbeddedId
    private BookTraderId id;

    // V129 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "role", nullable = false, length = 20)
    private String role = "PRIMARY";

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

    public BookTraderId getId() {
        return id;
    }

    public void setId(BookTraderId id) {
        this.id = id;
    }

    public Integer getBookId() {
        return id == null ? null : id.getBookId();
    }

    public void setBookId(Integer bookId) {
        if (id == null) id = new BookTraderId();
        id.setBookId(bookId);
    }

    public Integer getTraderId() {
        return id == null ? null : id.getTraderId();
    }

    public void setTraderId(Integer traderId) {
        if (id == null) id = new BookTraderId();
        id.setTraderId(traderId);
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
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
