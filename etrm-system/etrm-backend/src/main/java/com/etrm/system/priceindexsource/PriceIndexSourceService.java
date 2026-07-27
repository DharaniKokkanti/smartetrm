package com.etrm.system.priceindexsource;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.market.MarketProductLinkRepository;
import com.etrm.system.market.MarketRepository;
import com.etrm.system.priceindex.PriceIndexRepository;
import com.etrm.system.pricesource.PriceSourceRepository;
import com.etrm.system.product.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PriceIndexSourceService {

    private final PriceIndexSourceRepository repository;
    private final PriceIndexRepository priceIndexRepository;
    private final PriceSourceRepository priceSourceRepository;
    private final MarketProductLinkRepository marketProductLinkRepository;
    private final MarketRepository marketRepository;
    private final ProductRepository productRepository;

    public PriceIndexSourceService(PriceIndexSourceRepository repository,
                                    PriceIndexRepository priceIndexRepository,
                                    PriceSourceRepository priceSourceRepository,
                                    MarketProductLinkRepository marketProductLinkRepository,
                                    MarketRepository marketRepository,
                                    ProductRepository productRepository) {
        this.repository = repository;
        this.priceIndexRepository = priceIndexRepository;
        this.priceSourceRepository = priceSourceRepository;
        this.marketProductLinkRepository = marketProductLinkRepository;
        this.marketRepository = marketRepository;
        this.productRepository = productRepository;
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
        marketProductLinkRepository.findById(pis.getMarketProductLinkId()).ifPresent(mpl -> {
            productRepository.findById(mpl.getProductId()).ifPresent(p -> pis.setProductCode(p.getProductCode()));
            marketRepository.findById(mpl.getMarketId()).ifPresent(m -> pis.setMarketCode(m.getMarketCode()));
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
