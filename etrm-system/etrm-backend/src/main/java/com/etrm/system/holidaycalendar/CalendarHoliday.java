package com.etrm.system.holidaycalendar;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * V100. The actual holiday dates for a dbo.holiday_calendar row.
 *
 * V144 — row_version (optimistic locking, see LegalEntity.rowVersion for the
 * full explanation) and created_at/created_by/updated_at/updated_by all
 * added fresh; this entity had none of the standard governance columns.
 * There is no update endpoint for CalendarHoliday (only create/bulk-create/
 * delete via HolidayCalendarService), so no null-rowVersion guard is needed
 * here — see HolidayCalendarService.createHoliday/deleteHoliday.
 */
@Entity
@Table(name = "calendar_holiday")
@EntityListeners(AuditingEntityListener.class)
public class CalendarHoliday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "holiday_id")
    private Integer holidayId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    // Not @NotNull: calendarId is always resolved from the {calendarId} path
    // variable by HolidayCalendarController/Service, never sent in the
    // request body (HolidayCalendarService.createHoliday sets it before
    // save) — a request body legitimately omits it. Bean validation runs on
    // the raw @RequestBody before that resolution happens, so a @NotNull
    // here made POST .../{calendarId}/holidays 400 on every real call
    // (caught by HolidayCalendarControllerTest). The DB's own NOT NULL
    // constraint is still the final backstop.
    @Column(name = "calendar_id", nullable = false)
    private Integer calendarId;

    @NotNull
    @Column(name = "holiday_date", nullable = false)
    private LocalDate holidayDate;

    @NotBlank
    @Size(max = 200)
    @Column(name = "holiday_name", nullable = false, length = 200)
    private String holidayName;

    @NotNull
    @Column(name = "is_settlement_holiday", nullable = false)
    private Boolean isSettlementHoliday = true;

    @NotNull
    @Column(name = "is_trading_holiday", nullable = false)
    private Boolean isTradingHoliday = true;

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

    public Integer getHolidayId() {
        return holidayId;
    }

    public void setHolidayId(Integer holidayId) {
        this.holidayId = holidayId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getCalendarId() {
        return calendarId;
    }

    public void setCalendarId(Integer calendarId) {
        this.calendarId = calendarId;
    }

    public LocalDate getHolidayDate() {
        return holidayDate;
    }

    public void setHolidayDate(LocalDate holidayDate) {
        this.holidayDate = holidayDate;
    }

    public String getHolidayName() {
        return holidayName;
    }

    public void setHolidayName(String holidayName) {
        this.holidayName = holidayName;
    }

    public Boolean getIsSettlementHoliday() {
        return isSettlementHoliday;
    }

    public void setIsSettlementHoliday(Boolean isSettlementHoliday) {
        this.isSettlementHoliday = isSettlementHoliday;
    }

    public Boolean getIsTradingHoliday() {
        return isTradingHoliday;
    }

    public void setIsTradingHoliday(Boolean isTradingHoliday) {
        this.isTradingHoliday = isTradingHoliday;
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
