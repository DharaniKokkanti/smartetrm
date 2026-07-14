package com.etrm.system.exchange;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ExchangeService {

    private final ExchangeRepository repository;
    private final CurrencyRepository currencyRepository;

    public ExchangeService(ExchangeRepository repository, CurrencyRepository currencyRepository) {
        this.repository = repository;
        this.currencyRepository = currencyRepository;
    }

    private Exchange hydrate(Exchange exchange) {
        currencyRepository.findById(exchange.getCurrencyId()).ifPresent(c -> exchange.setCurrencyCode(c.getCurrencyCode()));
        return exchange;
    }

    private void normalizeCodeField(Exchange input) {
        if (input.getExchangeCode() != null) input.setExchangeCode(input.getExchangeCode().toUpperCase());
    }

    @Transactional(readOnly = true)
    public List<Exchange> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Exchange create(Exchange input) {
        normalizeCodeField(input);
        if (repository.existsByExchangeCodeIgnoreCase(input.getExchangeCode())) {
            throw new ConflictException("Exchange Code \"" + input.getExchangeCode() + "\" already exists.");
        }
        input.setExchangeId(null);
        return hydrate(repository.save(input));
    }

    public Exchange update(Integer id, Exchange input) {
        Exchange existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No exchange with id " + id + "."));
        normalizeCodeField(input);
        input.setExchangeId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        Exchange existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No exchange with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
