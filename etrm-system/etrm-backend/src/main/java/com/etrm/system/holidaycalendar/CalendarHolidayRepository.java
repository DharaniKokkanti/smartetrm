package com.etrm.system.holidaycalendar;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CalendarHolidayRepository extends JpaRepository<CalendarHoliday, Integer> {
    List<CalendarHoliday> findByCalendarId(Integer calendarId);
    long countByCalendarId(Integer calendarId);
    boolean existsByCalendarIdAndHolidayDate(Integer calendarId, java.time.LocalDate holidayDate);
}
