package com.etrm.system.priceindex;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PriceIndexService {

    private final PriceIndexRepository repository;
    private final CurrencyRepository currencyRepository;
    private final UnitOfMeasureRepository uomRepository;

    public PriceIndexService(PriceIndexRepository repository,
                              CurrencyRepository currencyRepository, UnitOfMeasureRepository uomRepository) {
        this.repository = repository;
        this.currencyRepository = currencyRepository;
        this.uomRepository = uomRepository;
    }

    private PriceIndex hydrate(PriceIndex pi) {
        currencyRepository.findById(pi.getCurrencyId()).ifPresent(c -> pi.setCurrencyCode(c.getCurrencyCode()));
        uomRepository.findById(pi.getUomId()).ifPresent(u -> pi.setUomCode(u.getUomCode()));
        return pi;
    }

    private void normalizeCodeField(PriceIndex input) {
        if (input.getIndexCode() != null) input.setIndexCode(input.getIndexCode().toUpperCase());
    }

    @Transactional(readOnly = true)
    public List<PriceIndex> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public PriceIndex create(PriceIndex input) {
        normalizeCodeField(input);
        if (repository.existsByIndexCodeIgnoreCase(input.getIndexCode())) {
            throw new ConflictException("Index Code \"" + input.getIndexCode() + "\" already exists.");
        }
        input.setPriceIndexId(null);
        return hydrate(repository.save(input));
    }

    public PriceIndex update(Integer id, PriceIndex input) {
        PriceIndex existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No price index with id " + id + "."));
        normalizeCodeField(input);
        input.setPriceIndexId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing
        // only populates those on insert, so the request body never carries
        // them; without copying them from the existing row here, updatable=
        // false keeps the DB value untouched but the response would show
        // them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        PriceIndex existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No price index with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
