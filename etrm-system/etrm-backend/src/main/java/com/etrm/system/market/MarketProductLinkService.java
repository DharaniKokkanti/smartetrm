package com.etrm.system.market;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.pricesource.PriceSourceRepository;
import com.etrm.system.product.ProductRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MarketProductLinkService {

    private final MarketProductLinkRepository repository;
    private final ProductRepository productRepository;
    private final CurrencyRepository currencyRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final MarketRepository marketRepository;
    private final PriceSourceRepository priceSourceRepository;

    public MarketProductLinkService(MarketProductLinkRepository repository, ProductRepository productRepository,
                                     CurrencyRepository currencyRepository, UnitOfMeasureRepository uomRepository,
                                     MarketRepository marketRepository, PriceSourceRepository priceSourceRepository) {
        this.repository = repository;
        this.productRepository = productRepository;
        this.currencyRepository = currencyRepository;
        this.uomRepository = uomRepository;
        this.marketRepository = marketRepository;
        this.priceSourceRepository = priceSourceRepository;
    }

    private MarketProductLink hydrate(MarketProductLink mp) {
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
        if (mp.getAltPriceSourceId() != null) {
            priceSourceRepository.findById(mp.getAltPriceSourceId()).ifPresent(s -> mp.setAltPriceSourceCode(s.getSourceCode()));
        }
        if (mp.getMtmPriceSourceId() != null) {
            priceSourceRepository.findById(mp.getMtmPriceSourceId()).ifPresent(s -> mp.setMtmPriceSourceCode(s.getSourceCode()));
        }
        return mp;
    }

    /** Also stamps marketCode — used by pickers (e.g. the Period screen)
     *  that need a flat, cross-market list rather than one scoped by
     *  marketId, where the market itself needs a visible label too. */
    private MarketProductLink hydrateWithMarket(MarketProductLink mp) {
        hydrate(mp);
        marketRepository.findById(mp.getMarketId()).ifPresent(m -> mp.setMarketCode(m.getMarketCode()));
        return mp;
    }

    @Transactional(readOnly = true)
    public List<MarketProductLink> listAll() {
        return repository.findAll().stream().map(this::hydrateWithMarket).toList();
    }

    @Transactional(readOnly = true)
    public List<MarketProductLink> listByMarket(Integer marketId) {
        return repository.findByMarketId(marketId).stream().map(this::hydrate).toList();
    }

    @Transactional(readOnly = true)
    public List<MarketProductLink> listByProduct(Integer productId) {
        return repository.findByProductId(productId).stream().map(this::hydrate).toList();
    }

    public MarketProductLink create(Integer marketId, MarketProductLink input) {
        input.setMarketProductLinkId(null);
        input.setMarketId(marketId);
        return hydrate(repository.save(input));
    }

    public MarketProductLink update(Integer marketId, Integer marketProductLinkId, MarketProductLink input) {
        MarketProductLink existing = repository.findById(marketProductLinkId)
                .orElseThrow(() -> new NotFoundException("No market product link with id " + marketProductLinkId + "."));
        input.setMarketProductLinkId(marketProductLinkId);
        input.setMarketId(marketId);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing
        // only populates those on insert, so the request body never carries
        // them; without copying them from the existing row here, updatable=
        // false keeps the DB value untouched but the response would show
        // them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer marketProductLinkId) {
        MarketProductLink existing = repository.findById(marketProductLinkId)
                .orElseThrow(() -> new NotFoundException("No market product link with id " + marketProductLinkId + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
