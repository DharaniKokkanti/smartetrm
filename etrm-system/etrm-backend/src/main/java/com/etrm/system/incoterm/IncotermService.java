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
        if (!repository.existsById(id)) {
            throw new NotFoundException("No incoterm with id " + id + ".");
        }
        input.setIncotermId(id);
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        Incoterm existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No incoterm with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
