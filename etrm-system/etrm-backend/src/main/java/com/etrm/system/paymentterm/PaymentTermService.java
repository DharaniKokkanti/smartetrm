package com.etrm.system.paymentterm;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.holidaycalendar.HolidayCalendarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PaymentTermService {

    private final PaymentTermRepository repository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final HolidayCalendarRepository holidayCalendarRepository;

    public PaymentTermService(PaymentTermRepository repository, PaymentMethodRepository paymentMethodRepository,
                               HolidayCalendarRepository holidayCalendarRepository) {
        this.repository = repository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.holidayCalendarRepository = holidayCalendarRepository;
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
}
