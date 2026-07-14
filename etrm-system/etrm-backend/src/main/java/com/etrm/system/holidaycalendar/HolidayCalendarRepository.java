package com.etrm.system.holidaycalendar;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HolidayCalendarRepository extends JpaRepository<HolidayCalendar, Integer> {
    boolean existsByCalendarCodeIgnoreCase(String calendarCode);
}
