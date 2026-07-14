package com.etrm.system.product;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SpecParameterService {

    private final SpecParameterRepository repository;

    public SpecParameterService(SpecParameterRepository repository) {
        this.repository = repository;
    }

    public List<SpecParameter> list(String commodityType) {
        if (commodityType == null || commodityType.isBlank()) {
            return repository.findAll();
        }
        return repository.findAll().stream()
                .filter(p -> commodityType.equalsIgnoreCase(p.getCommodityType()))
                .toList();
    }
}
