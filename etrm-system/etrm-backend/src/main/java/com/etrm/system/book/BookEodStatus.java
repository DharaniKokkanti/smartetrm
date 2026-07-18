package com.etrm.system.book;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.book_eod_status (V123) — one row per (leaf book, business date). A
 * lock/reopen is a fact about a specific trading day, not a permanent
 * property of the book, so it can't be a single BIT column on dbo.book —
 * that would throw away the audit trail of every prior day's lock/unlock.
 * Same reason-required shape as Book.archivedReason (V119).
 */
@Entity
@Table(name = "book_eod_status")
public class BookEodStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "book_eod_status_id")
    private Integer bookEodStatusId;

    @Column(name = "book_id", nullable = false)
    private Integer bookId;

    @Column(name = "business_date", nullable = false)
    private LocalDate businessDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "OPEN";   // OPEN | LOCKED | REOPENED

    @Column(name = "locked_by", length = 100)
    private String lockedBy;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "reopened_by", length = 100)
    private String reopenedBy;

    @Column(name = "reopened_at")
    private LocalDateTime reopenedAt;

    @Column(name = "reopen_reason", length = 500)
    private String reopenReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Integer getBookEodStatusId() {
        return bookEodStatusId;
    }

    public void setBookEodStatusId(Integer bookEodStatusId) {
        this.bookEodStatusId = bookEodStatusId;
    }

    public Integer getBookId() {
        return bookId;
    }

    public void setBookId(Integer bookId) {
        this.bookId = bookId;
    }

    public LocalDate getBusinessDate() {
        return businessDate;
    }

    public void setBusinessDate(LocalDate businessDate) {
        this.businessDate = businessDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLockedBy() {
        return lockedBy;
    }

    public void setLockedBy(String lockedBy) {
        this.lockedBy = lockedBy;
    }

    public LocalDateTime getLockedAt() {
        return lockedAt;
    }

    public void setLockedAt(LocalDateTime lockedAt) {
        this.lockedAt = lockedAt;
    }

    public String getReopenedBy() {
        return reopenedBy;
    }

    public void setReopenedBy(String reopenedBy) {
        this.reopenedBy = reopenedBy;
    }

    public LocalDateTime getReopenedAt() {
        return reopenedAt;
    }

    public void setReopenedAt(LocalDateTime reopenedAt) {
        this.reopenedAt = reopenedAt;
    }

    public String getReopenReason() {
        return reopenReason;
    }

    public void setReopenReason(String reopenReason) {
        this.reopenReason = reopenReason;
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
