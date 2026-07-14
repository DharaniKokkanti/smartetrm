package com.etrm.system.market;

import com.etrm.system.commodity.CommodityRepository;
import com.etrm.system.commodity.CommodityTypeMapping;
import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.exchange.ExchangeRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MarketService {

    private final MarketRepository repository;
    private final ExchangeRepository exchangeRepository;
    private final CommodityRepository commodityRepository;
    private final CurrencyRepository currencyRepository;
    private final UnitOfMeasureRepository uomRepository;

    public MarketService(MarketRepository repository, ExchangeRepository exchangeRepository,
                          CommodityRepository commodityRepository, CurrencyRepository currencyRepository,
                          UnitOfMeasureRepository uomRepository) {
        this.repository = repository;
        this.exchangeRepository = exchangeRepository;
        this.commodityRepository = commodityRepository;
        this.currencyRepository = currencyRepository;
        this.uomRepository = uomRepository;
    }

    private Market hydrate(Market market) {
        if (market.getExchangeId() != null) {
            exchangeRepository.findById(market.getExchangeId()).ifPresent(e -> market.setExchangeCode(e.getExchangeCode()));
        }
        if (market.getCommodityId() != null) {
            commodityRepository.findById(market.getCommodityId())
                    .ifPresent(c -> market.setCommodityType(CommodityTypeMapping.codeToType(c.getCommodityCode())));
        }
        currencyRepository.findById(market.getCurrencyId()).ifPresent(c -> market.setCurrencyCode(c.getCurrencyCode()));
        if (market.getContractUomId() != null) {
            uomRepository.findById(market.getContractUomId()).ifPresent(u -> market.setContractUomCode(u.getUomCode()));
        }
        return market;
    }

    private void resolveForeignKeys(Market input) {
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

    private void normalizeCodeField(Market input) {
        if (input.getMarketCode() != null) input.setMarketCode(input.getMarketCode().toUpperCase());
    }

    @Transactional(readOnly = true)
    public List<Market> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Market create(Market input) {
        normalizeCodeField(input);
        if (repository.existsByMarketCodeIgnoreCase(input.getMarketCode())) {
            throw new ConflictException("Market Code \"" + input.getMarketCode() + "\" already exists.");
        }
        resolveForeignKeys(input);
        input.setMarketId(null);
        return hydrate(repository.save(input));
    }

    public Market update(Integer id, Market input) {
        Market existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No market with id " + id + "."));
        normalizeCodeField(input);
        resolveForeignKeys(input);
        input.setMarketId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        Market existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No market with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
