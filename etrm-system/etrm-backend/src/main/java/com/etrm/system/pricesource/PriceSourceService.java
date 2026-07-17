package com.etrm.system.pricesource;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PriceSourceService {

    private final PriceSourceRepository repository;

    public PriceSourceService(PriceSourceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PriceSource> list() {
        return repository.findAll();
    }

    public PriceSource create(PriceSource input) {
        input.setPriceSourceId(null);
        return repository.save(input);
    }

    public PriceSource update(Integer id, PriceSource input) {
        PriceSource existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No price source with id " + id + "."));
        input.setPriceSourceId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        PriceSource existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No price source with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
