package com.etrm.system.paymentterm;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PaymentMethodService {

    private final PaymentMethodRepository repository;

    public PaymentMethodService(PaymentMethodRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PaymentMethod> list() {
        return repository.findAll();
    }

    public PaymentMethod create(PaymentMethod input) {
        input.setPaymentMethodId(null);
        return repository.save(input);
    }

    public PaymentMethod update(Integer id, PaymentMethod input) {
        PaymentMethod existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No payment method with id " + id + "."));
        input.setPaymentMethodId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing only
        // populates those on insert, so the request body never carries them;
        // without copying them from the existing row, the DB value is untouched
        // (updatable = false) but the response would show them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        PaymentMethod existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No payment method with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
