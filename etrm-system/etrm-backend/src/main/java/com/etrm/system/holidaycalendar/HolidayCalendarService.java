package com.etrm.system.holidaycalendar;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class HolidayCalendarService {

    private final HolidayCalendarRepository repository;
    private final CalendarHolidayRepository holidayRepository;

    public HolidayCalendarService(HolidayCalendarRepository repository, CalendarHolidayRepository holidayRepository) {
        this.repository = repository;
        this.holidayRepository = holidayRepository;
    }

    private HolidayCalendar withHolidayCount(HolidayCalendar calendar) {
        calendar.setHolidayCount((int) holidayRepository.countByCalendarId(calendar.getCalendarId()));
        return calendar;
    }

    @Transactional(readOnly = true)
    public List<HolidayCalendar> list() {
        return repository.findAll().stream().map(this::withHolidayCount).toList();
    }

    @Transactional(readOnly = true)
    public HolidayCalendar get(Integer id) {
        return withHolidayCount(repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No holiday calendar with id " + id + ".")));
    }

    private void normalizeCodeField(HolidayCalendar input) {
        if (input.getCalendarCode() != null) input.setCalendarCode(input.getCalendarCode().toUpperCase());
    }

    public HolidayCalendar create(HolidayCalendar input) {
        normalizeCodeField(input);
        if (repository.existsByCalendarCodeIgnoreCase(input.getCalendarCode())) {
            throw new ConflictException("Calendar Code \"" + input.getCalendarCode() + "\" already exists.");
        }
        input.setCalendarId(null);
        input.setCreatedAt(LocalDateTime.now());
        return withHolidayCount(repository.save(input));
    }

    public HolidayCalendar update(Integer id, HolidayCalendar input) {
        HolidayCalendar existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No holiday calendar with id " + id + "."));
        normalizeCodeField(input);
        input.setCalendarId(id);
        input.setCreatedAt(existing.getCreatedAt());
        return withHolidayCount(repository.save(input));
    }

    public void deactivate(Integer id) {
        HolidayCalendar existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No holiday calendar with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }

    @Transactional(readOnly = true)
    public List<CalendarHoliday> listHolidays(Integer calendarId) {
        return holidayRepository.findByCalendarId(calendarId);
    }

    public CalendarHoliday createHoliday(Integer calendarId, CalendarHoliday input) {
        if (!repository.existsById(calendarId)) {
            throw new NotFoundException("No holiday calendar with id " + calendarId + ".");
        }
        if (holidayRepository.existsByCalendarIdAndHolidayDate(calendarId, input.getHolidayDate())) {
            throw new ConflictException("A holiday already exists on " + input.getHolidayDate() + " for this calendar.");
        }
        input.setHolidayId(null);
        input.setCalendarId(calendarId);
        return holidayRepository.save(input);
    }

    public void deleteHoliday(Integer calendarId, Integer holidayId) {
        CalendarHoliday holiday = holidayRepository.findById(holidayId)
                .orElseThrow(() -> new NotFoundException("No holiday with id " + holidayId + "."));
        if (!holiday.getCalendarId().equals(calendarId)) {
            throw new NotFoundException("No holiday with id " + holidayId + " on calendar " + calendarId + ".");
        }
        holidayRepository.deleteById(holidayId);
    }

    /** Mirrors LegalEntityService.bulkCreate's contract — duplicates rejected with a reason, not silently skipped. */
    public BulkResult bulkCreateHolidays(Integer calendarId, List<CalendarHoliday> inputs) {
        if (!repository.existsById(calendarId)) {
            throw new NotFoundException("No holiday calendar with id " + calendarId + ".");
        }
        List<CalendarHoliday> created = new ArrayList<>();
        List<RejectedRow> rejected = new ArrayList<>();
        for (CalendarHoliday input : inputs) {
            if (holidayRepository.existsByCalendarIdAndHolidayDate(calendarId, input.getHolidayDate())) {
                rejected.add(new RejectedRow(input, "A holiday already exists on " + input.getHolidayDate() + " for this calendar."));
                continue;
            }
            try {
                input.setHolidayId(null);
                input.setCalendarId(calendarId);
                created.add(holidayRepository.save(input));
            } catch (DataIntegrityViolationException ex) {
                rejected.add(new RejectedRow(input, "Row rejected — violates a database constraint."));
            }
        }
        return new BulkResult(created, rejected);
    }

    public record RejectedRow(CalendarHoliday row, String reason) {}
    public record BulkResult(List<CalendarHoliday> created, List<RejectedRow> rejected) {}
}
