package com.etrm.system.rinfuelcategory;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class RinFuelCategoryService {

    private final RinFuelCategoryRepository repository;

    public RinFuelCategoryService(RinFuelCategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<RinFuelCategory> list() {
        return repository.findAll();
    }

    public RinFuelCategory create(RinFuelCategory input) {
        input.setCategoryId(null);
        LocalDateTime now = LocalDateTime.now();
        input.setCreatedAt(now);
        input.setUpdatedAt(now);
        return repository.save(input);
    }

    public RinFuelCategory update(Integer id, RinFuelCategory input) {
        RinFuelCategory existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No RIN fuel category with id " + id + "."));
        input.setCategoryId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setUpdatedAt(LocalDateTime.now());
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        RinFuelCategory existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No RIN fuel category with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
