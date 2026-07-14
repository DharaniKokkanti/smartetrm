package com.etrm.system.market;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.product.ProductRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class MarketProductService {

    private final MarketProductRepository repository;
    private final ProductRepository productRepository;
    private final CurrencyRepository currencyRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final AuditorAware<String> auditorAware;

    public MarketProductService(MarketProductRepository repository, ProductRepository productRepository,
                                 CurrencyRepository currencyRepository, UnitOfMeasureRepository uomRepository,
                                 AuditorAware<String> auditorAware) {
        this.repository = repository;
        this.productRepository = productRepository;
        this.currencyRepository = currencyRepository;
        this.uomRepository = uomRepository;
        this.auditorAware = auditorAware;
    }

    private MarketProduct hydrate(MarketProduct mp) {
        productRepository.findById(mp.getProductId()).ifPresent(p -> {
            mp.setProductCode(p.getProductCode());
            mp.setProductName(p.getProductName());
        });
        if (mp.getCurrencyId() != null) {
            currencyRepository.findById(mp.getCurrencyId()).ifPresent(c -> mp.setCurrencyCode(c.getCurrencyCode()));
        }
        if (mp.getUomId() != null) {
            uomRepository.findById(mp.getUomId()).ifPresent(u -> mp.setUomCode(u.getUomCode()));
        }
        return mp;
    }

    @Transactional(readOnly = true)
    public List<MarketProduct> listByMarket(Integer marketId) {
        return repository.findByMarketId(marketId).stream().map(this::hydrate).toList();
    }

    @Transactional(readOnly = true)
    public List<MarketProduct> listByProduct(Integer productId) {
        return repository.findByProductId(productId).stream().map(this::hydrate).toList();
    }

    public MarketProduct create(Integer marketId, MarketProduct input) {
        input.setMarketProductId(null);
        input.setMarketId(marketId);
        input.setCreatedAt(LocalDateTime.now());
        input.setCreatedBy(auditorAware.getCurrentAuditor().orElse("SYSTEM"));
        return hydrate(repository.save(input));
    }

    public MarketProduct update(Integer marketId, Integer marketProductId, MarketProduct input) {
        MarketProduct existing = repository.findById(marketProductId)
                .orElseThrow(() -> new NotFoundException("No market product with id " + marketProductId + "."));
        input.setMarketProductId(marketProductId);
        input.setMarketId(marketId);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer marketProductId) {
        MarketProduct existing = repository.findById(marketProductId)
                .orElseThrow(() -> new NotFoundException("No market product with id " + marketProductId + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
