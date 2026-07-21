package com.etrm.system.broker;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BrokerService {

    private final BrokerRepository repository;

    public BrokerService(BrokerRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Broker> list() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Broker get(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No broker with id " + id + "."));
    }

    private void normalizeCodeField(Broker input) {
        if (input.getBrokerCode() != null) input.setBrokerCode(input.getBrokerCode().toUpperCase());
    }

    public Broker create(Broker input) {
        normalizeCodeField(input);
        if (repository.existsByBrokerCodeIgnoreCase(input.getBrokerCode())) {
            throw new ConflictException("Broker Code \"" + input.getBrokerCode() + "\" already exists.");
        }
        input.setBrokerId(null);
        return repository.save(input);
    }

    public Broker update(Integer id, Broker input) {
        Broker existing = get(id);
        normalizeCodeField(input);
        input.setBrokerId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing
        // only populates those on insert, so the request body never carries
        // them; without copying them from the existing row here, updatable=
        // false keeps the DB value untouched but the response would show
        // them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        Broker existing = get(id);
        existing.setIsActive(false);
        repository.save(existing);
    }
}
