package com.etrm.system.priceindex;

import com.etrm.system.commodity.CommodityRepository;
import com.etrm.system.commodity.CommodityTypeMapping;
import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PriceIndexService {

    private final PriceIndexRepository repository;
    private final CommodityRepository commodityRepository;
    private final CurrencyRepository currencyRepository;
    private final UnitOfMeasureRepository uomRepository;

    public PriceIndexService(PriceIndexRepository repository, CommodityRepository commodityRepository,
                              CurrencyRepository currencyRepository, UnitOfMeasureRepository uomRepository) {
        this.repository = repository;
        this.commodityRepository = commodityRepository;
        this.currencyRepository = currencyRepository;
        this.uomRepository = uomRepository;
    }

    private PriceIndex hydrate(PriceIndex pi) {
        if (pi.getCommodityId() != null) {
            commodityRepository.findById(pi.getCommodityId())
                    .ifPresent(c -> pi.setCommodityType(CommodityTypeMapping.codeToType(c.getCommodityCode())));
        }
        currencyRepository.findById(pi.getCurrencyId()).ifPresent(c -> pi.setCurrencyCode(c.getCurrencyCode()));
        uomRepository.findById(pi.getUomId()).ifPresent(u -> pi.setUomCode(u.getUomCode()));
        return pi;
    }

    private void resolveForeignKeys(PriceIndex input) {
        if (input.getCommodityType() != null) {
            String code = CommodityTypeMapping.typeToCode(input.getCommodityType());
            if (code == null) {
                throw new NotFoundException("No commodity mapping for type \"" + input.getCommodityType() + "\".");
            }
            input.setCommodityId(commodityRepository.findByCommodityCodeIgnoreCase(code)
                    .orElseThrow(() -> new NotFoundException("No commodity \"" + code + "\"."))
                    .getCommodityId());
        }
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
        resolveForeignKeys(input);
        input.setPriceIndexId(null);
        input.setCreatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public PriceIndex update(Integer id, PriceIndex input) {
        PriceIndex existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No price index with id " + id + "."));
        normalizeCodeField(input);
        resolveForeignKeys(input);
        input.setPriceIndexId(id);
        input.setCreatedAt(existing.getCreatedAt());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        PriceIndex existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No price index with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
