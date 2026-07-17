package com.etrm.system.paymentterm;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
        input.setCreatedAt(LocalDateTime.now());
        return repository.save(input);
    }

    public PaymentMethod update(Integer id, PaymentMethod input) {
        PaymentMethod existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No payment method with id " + id + "."));
        input.setPaymentMethodId(id);
        input.setCreatedAt(existing.getCreatedAt());
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        PaymentMethod existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No payment method with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
