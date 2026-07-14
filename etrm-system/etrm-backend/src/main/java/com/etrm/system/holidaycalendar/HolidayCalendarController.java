package com.etrm.system.holidaycalendar;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/calendar/holiday-calendars/api.ts. */
@RestController
@RequestMapping("/api/v1/holiday-calendars")
public class HolidayCalendarController {

    private final HolidayCalendarService service;

    public HolidayCalendarController(HolidayCalendarService service) {
        this.service = service;
    }

    @GetMapping
    public List<HolidayCalendar> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<HolidayCalendar> create(@Valid @RequestBody HolidayCalendar input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public HolidayCalendar update(@PathVariable Integer id, @Valid @RequestBody HolidayCalendar input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{calendarId}/holidays")
    public List<CalendarHoliday> listHolidays(@PathVariable Integer calendarId) {
        return service.listHolidays(calendarId);
    }

    @PostMapping("/{calendarId}/holidays")
    public ResponseEntity<CalendarHoliday> createHoliday(@PathVariable Integer calendarId, @Valid @RequestBody CalendarHoliday input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createHoliday(calendarId, input));
    }

    @DeleteMapping("/{calendarId}/holidays/{holidayId}")
    public ResponseEntity<Void> deleteHoliday(@PathVariable Integer calendarId, @PathVariable Integer holidayId) {
        service.deleteHoliday(calendarId, holidayId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{calendarId}/holidays/bulk")
    public HolidayCalendarService.BulkResult bulkCreateHolidays(@PathVariable Integer calendarId, @RequestBody BulkCreateRequest request) {
        return service.bulkCreateHolidays(calendarId, request.holidays());
    }

    public record BulkCreateRequest(List<CalendarHoliday> holidays) {}
}
