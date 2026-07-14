package com.etrm.system.product;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.priceindex.PriceIndexRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProductPriceIndexService {

    private final ProductPriceIndexRepository repository;
    private final PriceIndexRepository priceIndexRepository;
    private final CurrencyRepository currencyRepository;
    private final UnitOfMeasureRepository uomRepository;

    public ProductPriceIndexService(ProductPriceIndexRepository repository, PriceIndexRepository priceIndexRepository,
                                     CurrencyRepository currencyRepository, UnitOfMeasureRepository uomRepository) {
        this.repository = repository;
        this.priceIndexRepository = priceIndexRepository;
        this.currencyRepository = currencyRepository;
        this.uomRepository = uomRepository;
    }

    private ProductPriceIndex hydrate(ProductPriceIndex link) {
        priceIndexRepository.findById(link.getPriceIndexId()).ifPresent(pi -> {
            link.setIndexCode(pi.getIndexCode());
            link.setIndexName(pi.getIndexName());
            link.setPublicationSource(pi.getPublicationSource());
            currencyRepository.findById(pi.getCurrencyId()).ifPresent(c -> link.setCurrencyCode(c.getCurrencyCode()));
            uomRepository.findById(pi.getUomId()).ifPresent(u -> link.setUomCode(u.getUomCode()));
        });
        return link;
    }

    @Transactional(readOnly = true)
    public List<ProductPriceIndex> list(Integer productId) {
        return repository.findByProductId(productId).stream().map(this::hydrate).toList();
    }

    public ProductPriceIndex link(Integer productId, ProductPriceIndex input) {
        input.setProductIndexId(null);
        input.setProductId(productId);
        return hydrate(repository.save(input));
    }

    public void unlink(Integer productIndexId) {
        if (!repository.existsById(productIndexId)) {
            throw new NotFoundException("No product price index link with id " + productIndexId + ".");
        }
        repository.deleteById(productIndexId);
    }
}
