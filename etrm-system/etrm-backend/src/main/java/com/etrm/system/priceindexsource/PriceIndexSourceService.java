package com.etrm.system.priceindexsource;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.priceindex.PriceIndexRepository;
import com.etrm.system.pricesource.PriceSourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PriceIndexSourceService {

    private final PriceIndexSourceRepository repository;
    private final PriceIndexRepository priceIndexRepository;
    private final PriceSourceRepository priceSourceRepository;

    public PriceIndexSourceService(PriceIndexSourceRepository repository,
                                    PriceIndexRepository priceIndexRepository,
                                    PriceSourceRepository priceSourceRepository) {
        this.repository = repository;
        this.priceIndexRepository = priceIndexRepository;
        this.priceSourceRepository = priceSourceRepository;
    }

    private PriceIndexSource hydrate(PriceIndexSource pis) {
        priceIndexRepository.findById(pis.getPriceIndexId()).ifPresent(idx -> {
            pis.setPriceIndexCode(idx.getIndexCode());
            pis.setPriceIndexName(idx.getIndexName());
        });
        priceSourceRepository.findById(pis.getPriceSourceId()).ifPresent(src -> {
            pis.setSourceCode(src.getSourceCode());
            pis.setSourceName(src.getSourceName());
        });
        return pis;
    }

    @Transactional(readOnly = true)
    public List<PriceIndexSource> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    @Transactional(readOnly = true)
    public List<PriceIndexSource> listByPriceSource(Integer priceSourceId) {
        return repository.findByPriceSourceId(priceSourceId).stream().map(this::hydrate).toList();
    }

    public PriceIndexSource create(PriceIndexSource input) {
        input.setPisId(null);
        return hydrate(repository.save(input));
    }

    public PriceIndexSource update(Integer id, PriceIndexSource input) {
        PriceIndexSource existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No price index source link with id " + id + "."));
        input.setPisId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        PriceIndexSource existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No price index source link with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
