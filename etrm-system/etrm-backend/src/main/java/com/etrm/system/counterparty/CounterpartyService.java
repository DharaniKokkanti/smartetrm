package com.etrm.system.counterparty;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class CounterpartyService {

    private final CounterpartyRepository repository;

    public CounterpartyService(CounterpartyRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Counterparty> list() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Counterparty get(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No counterparty with id " + id + "."));
    }

    public Counterparty create(Counterparty input) {
        if (repository.existsByCpCodeIgnoreCase(input.getCpCode())) {
            throw new ConflictException("Counterparty Code \"" + input.getCpCode() + "\" already exists.");
        }
        input.setCounterpartyId(null);
        input.setIsActive(true);
        input.setDeactivatedDate(null);
        return repository.save(input);
    }

    public Counterparty update(Integer id, Counterparty input) {
        Counterparty existing = get(id);
        input.setCounterpartyId(id);
        input.setCpCode(existing.getCpCode()); // immutable after creation, matches the frontend form
        input.setIsActive(existing.getIsActive());
        input.setDeactivatedDate(existing.getDeactivatedDate());
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        Counterparty existing = get(id);
        existing.setIsActive(false);
        existing.setDeactivatedDate(LocalDate.now());
        repository.save(existing);
    }
}
