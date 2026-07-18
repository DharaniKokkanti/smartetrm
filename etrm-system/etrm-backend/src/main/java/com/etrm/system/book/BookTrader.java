package com.etrm.system.book;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * dbo.book_trader (V119) — replaces book.responsible_trader_id with a join
 * table so a book can be shared across several traders (PRIMARY/SECONDARY/
 * BACKUP). Only created_at/created_by (no updated columns) so this does not
 * extend AuditableEntity — matches UserRoleAssignment's onCreate() pattern.
 */
@Entity
@Table(name = "book_trader")
public class BookTrader {

    @EmbeddedId
    private BookTraderId id;

    @NotNull
    @Column(name = "role", nullable = false, length = 20)
    private String role = "PRIMARY";

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

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
}
