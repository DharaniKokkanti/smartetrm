package com.etrm.system.paymentterm;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.holidaycalendar.CalendarHolidayRepository;
import com.etrm.system.holidaycalendar.HolidayCalendarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentTermService {

    private final PaymentTermRepository repository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final HolidayCalendarRepository holidayCalendarRepository;
    private final CalendarHolidayRepository calendarHolidayRepository;

    public PaymentTermService(PaymentTermRepository repository, PaymentMethodRepository paymentMethodRepository,
                               HolidayCalendarRepository holidayCalendarRepository,
                               CalendarHolidayRepository calendarHolidayRepository) {
        this.repository = repository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.holidayCalendarRepository = holidayCalendarRepository;
        this.calendarHolidayRepository = calendarHolidayRepository;
    }

    private PaymentTerm hydrate(PaymentTerm term) {
        paymentMethodRepository.findById(term.getPaymentMethod())
                .ifPresent(m -> term.setPaymentMethodCode(m.getTypeCode()));
        if (term.getCalendarId() != null) {
            holidayCalendarRepository.findById(term.getCalendarId())
                    .ifPresent(c -> term.setCalendarCode(c.getCalendarCode()));
        }
        return term;
    }

    @Transactional(readOnly = true)
    public List<PaymentTerm> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public PaymentTerm create(PaymentTerm input) {
        input.setPaymentTermId(null);
        input.setCreatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public PaymentTerm update(Integer id, PaymentTerm input) {
        PaymentTerm existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No payment term with id " + id + "."));
        input.setPaymentTermId(id);
        input.setCreatedAt(existing.getCreatedAt());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        PaymentTerm existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No payment term with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }

    /**
     * Applies the payment_term's date-calculation rule to a caller-resolved base date.
     * Callers resolve which real-world date corresponds to the term's base_date_event
     * (e.g. END_OF_PRICING_PERIOD → trade_pricing_schedule.pricing_period_end,
     * BL_DATE → the trade's bill-of-lading date) — the term itself doesn't know
     * where each event's date lives, only how to offset from it.
     */
    @Transactional(readOnly = true)
    public LocalDate calculateDueDate(Integer id, LocalDate baseDate) {
        PaymentTerm term = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No payment term with id " + id + "."));
        Set<LocalDate> holidays = term.getCalendarId() == null
                ? Set.of()
                : calendarHolidayRepository.findByCalendarId(term.getCalendarId()).stream()
                        .map(h -> h.getHolidayDate())
                        .collect(Collectors.toSet());
        return PaymentDueDateCalculator.calculate(term, baseDate, holidays);
    }
}
