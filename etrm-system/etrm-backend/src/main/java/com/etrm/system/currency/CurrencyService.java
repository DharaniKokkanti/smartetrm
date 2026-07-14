package com.etrm.system.currency;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class CurrencyService {

    private final CurrencyRepository repository;

    public CurrencyService(CurrencyRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Currency> list() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Currency get(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No currency with id " + id + "."));
    }

    /** currencyCode is ISO 4217 — always stored uppercase regardless of how
     *  it was typed, matching the convention applied to every other code
     *  column in this schema. */
    private void normalizeCodeField(Currency input) {
        if (input.getCurrencyCode() != null) input.setCurrencyCode(input.getCurrencyCode().toUpperCase());
    }

    public Currency create(Currency input) {
        normalizeCodeField(input);
        if (repository.existsByCurrencyCodeIgnoreCase(input.getCurrencyCode())) {
            throw new ConflictException("Currency Code \"" + input.getCurrencyCode() + "\" already exists.");
        }
        input.setCurrencyId(null);
        input.setCreatedAt(LocalDateTime.now());
        return repository.save(input);
    }

    public Currency update(Integer id, Currency input) {
        Currency existing = get(id);
        normalizeCodeField(input);
        input.setCurrencyId(id);
        input.setCreatedAt(existing.getCreatedAt());
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        Currency existing = get(id);
        existing.setIsActive(false);
        repository.save(existing);
    }
}
