package com.etrm.system.product;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.incoterm.IncotermRepository;
import com.etrm.system.lookup.PricingTypeRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ProductService {

    private final ProductRepository repository;
    private final PricingTypeRepository pricingTypeRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final CurrencyRepository currencyRepository;
    private final IncotermRepository incotermRepository;

    public ProductService(ProductRepository repository, PricingTypeRepository pricingTypeRepository,
                           UnitOfMeasureRepository uomRepository, CurrencyRepository currencyRepository,
                           IncotermRepository incotermRepository) {
        this.repository = repository;
        this.pricingTypeRepository = pricingTypeRepository;
        this.uomRepository = uomRepository;
        this.currencyRepository = currencyRepository;
        this.incotermRepository = incotermRepository;
    }

    private Product hydrate(Product p) {
        if (p.getDefaultPricingTypeId() != null) {
            pricingTypeRepository.findById(p.getDefaultPricingTypeId()).ifPresent(t -> p.setDefaultPricingTypeCode(t.getTypeCode()));
        }
        if (p.getDefaultUomId() != null) {
            uomRepository.findById(p.getDefaultUomId()).ifPresent(u -> p.setDefaultUomCode(u.getUomCode()));
        }
        if (p.getDefaultCurrencyId() != null) {
            currencyRepository.findById(p.getDefaultCurrencyId()).ifPresent(c -> p.setDefaultCurrencyCode(c.getCurrencyCode()));
        }
        if (p.getDefaultIncotermId() != null) {
            incotermRepository.findById(p.getDefaultIncotermId()).ifPresent(i -> p.setDefaultIncotermCode(i.getCode()));
        }
        return p;
    }

    private void resolveForeignKeys(Product input) {
        if (input.getDefaultPricingTypeCode() != null) {
            input.setDefaultPricingTypeId(pricingTypeRepository.findByTypeCodeIgnoreCase(input.getDefaultPricingTypeCode())
                    .orElseThrow(() -> new NotFoundException("No pricing type \"" + input.getDefaultPricingTypeCode() + "\"."))
                    .getPricingTypeId());
        }
        if (input.getDefaultUomCode() != null) {
            // UnitOfMeasure is read-only (uomId + uomCode only) — resolve via a linear scan,
            // this table is small (~tens of rows), no dedicated finder needed for one caller.
            input.setDefaultUomId(uomRepository.findAll().stream()
                    .filter(u -> u.getUomCode().equalsIgnoreCase(input.getDefaultUomCode()))
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException("No UoM \"" + input.getDefaultUomCode() + "\"."))
                    .getUomId());
        }
        if (input.getDefaultCurrencyCode() != null) {
            input.setDefaultCurrencyId(currencyRepository.findAll().stream()
                    .filter(c -> c.getCurrencyCode().equalsIgnoreCase(input.getDefaultCurrencyCode()))
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException("No currency \"" + input.getDefaultCurrencyCode() + "\"."))
                    .getCurrencyId());
        }
        if (input.getDefaultIncotermCode() != null) {
            input.setDefaultIncotermId(incotermRepository.findByCodeIgnoreCase(input.getDefaultIncotermCode())
                    .orElseThrow(() -> new NotFoundException("No incoterm \"" + input.getDefaultIncotermCode() + "\"."))
                    .getIncotermId());
        }
    }

    private void normalizeCodeField(Product input) {
        if (input.getProductCode() != null) input.setProductCode(input.getProductCode().toUpperCase());
    }

    @Transactional(readOnly = true)
    public List<Product> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Product create(Product input) {
        normalizeCodeField(input);
        if (repository.existsByProductCodeIgnoreCase(input.getProductCode())) {
            throw new ConflictException("Product Code \"" + input.getProductCode() + "\" already exists.");
        }
        resolveForeignKeys(input);
        input.setProductId(null);
        input.setCreatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public Product update(Integer id, Product input) {
        Product existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No product with id " + id + "."));
        normalizeCodeField(input);
        resolveForeignKeys(input);
        input.setProductId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        input.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        Product existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No product with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
