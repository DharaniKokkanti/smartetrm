package com.etrm.system.formulatemplate;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class FormulaTemplateService {

    private final FormulaTemplateRepository repository;

    public FormulaTemplateService(FormulaTemplateRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<FormulaTemplate> list() {
        return repository.findAll();
    }

    public FormulaTemplate create(FormulaTemplate input) {
        input.setTemplateId(null);
        return repository.save(input);
    }

    public FormulaTemplate update(Integer id, FormulaTemplate input) {
        FormulaTemplate existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No formula template with id " + id + "."));
        input.setTemplateId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        FormulaTemplate existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No formula template with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
