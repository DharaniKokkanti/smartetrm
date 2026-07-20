package com.etrm.system.incoterm;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class IncotermService {

    private final IncotermRepository repository;

    public IncotermService(IncotermRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Incoterm> list() {
        return repository.findAll();
    }

    public Incoterm create(Incoterm input) {
        input.setIncotermId(null);
        input.setIsActive(true);
        return repository.save(input);
    }

    public Incoterm update(Integer id, Incoterm input) {
        Incoterm existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No incoterm with id " + id + "."));
        input.setIncotermId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing only
        // populates those on insert, so the request body never carries them;
        // without copying them from the existing row, the DB value is untouched
        // (updatable = false) but the response would show them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        Incoterm existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No incoterm with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
