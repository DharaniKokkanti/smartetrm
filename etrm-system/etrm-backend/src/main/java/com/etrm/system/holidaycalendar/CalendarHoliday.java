package com.etrm.system.holidaycalendar;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** V100. The actual holiday dates for a dbo.holiday_calendar row. */
@Entity
@Table(name = "calendar_holiday")
public class CalendarHoliday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "holiday_id")
    private Integer holidayId;

    @NotNull
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

    public Integer getHolidayId() {
        return holidayId;
    }

    public void setHolidayId(Integer holidayId) {
        this.holidayId = holidayId;
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
}
