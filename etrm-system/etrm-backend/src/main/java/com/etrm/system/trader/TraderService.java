package com.etrm.system.trader;

import com.etrm.system.auth.AppUserRepository;
import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.desk.DeskRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import com.etrm.system.lookup.CommodityType;
import com.etrm.system.lookup.CommodityTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class TraderService {

    private final TraderRepository repository;
    private final TraderCommodityLimitRepository limitRepository;
    private final AppUserRepository appUserRepository;
    private final LegalEntityRepository legalEntityRepository;
    private final DeskRepository deskRepository;
    private final CurrencyRepository currencyRepository;
    private final CommodityTypeRepository commodityTypeRepository;

    public TraderService(TraderRepository repository, TraderCommodityLimitRepository limitRepository,
                          AppUserRepository appUserRepository, LegalEntityRepository legalEntityRepository,
                          DeskRepository deskRepository, CurrencyRepository currencyRepository,
                          CommodityTypeRepository commodityTypeRepository) {
        this.repository = repository;
        this.limitRepository = limitRepository;
        this.appUserRepository = appUserRepository;
        this.legalEntityRepository = legalEntityRepository;
        this.deskRepository = deskRepository;
        this.currencyRepository = currencyRepository;
        this.commodityTypeRepository = commodityTypeRepository;
    }

    // trader.commodity_types is a raw CSV of dbo.commodity_type.type_code
    // (e.g. "OIL,GAS") — never converted to an FK (V85 only redirected the
    // single-value desk/book columns onto dbo.commodity_type, not this
    // multi-value CSV one). Translated to/from the frontend's List<Integer>
    // of commodity_type_id here.
    private Map<String, Integer> codeToIdMap() {
        return commodityTypeRepository.findAll().stream()
                .collect(Collectors.toMap(CommodityType::getTypeCode, CommodityType::getCommodityTypeId, (a, b) -> a));
    }

    private Map<Integer, String> idToCodeMap() {
        return commodityTypeRepository.findAll().stream()
                .collect(Collectors.toMap(CommodityType::getCommodityTypeId, CommodityType::getTypeCode, (a, b) -> a));
    }

    private Trader hydrate(Trader trader) {
        appUserRepository.findById(trader.getUserId()).ifPresent(u -> {
            trader.setFullName(u.getFullName());
            trader.setEmail(u.getEmail());
        });
        legalEntityRepository.findById(trader.getLegalEntityId())
                .ifPresent(le -> trader.setLegalEntityCode(le.getEntityCode()));
        if (trader.getDeskId() != null) {
            deskRepository.findById(trader.getDeskId()).ifPresent(d -> {
                trader.setDeskCode(d.getDeskCode());
                trader.setDeskName(d.getDeskName());
            });
        }
        if (trader.getApproverTraderId() != null) {
            repository.findById(trader.getApproverTraderId()).ifPresent(a -> trader.setApproverName(
                    a.getFullName() != null ? a.getFullName() : a.getTraderCode()));
        }
        Map<String, Integer> codeToId = codeToIdMap();
        List<Integer> ids = new ArrayList<>();
        String csv = trader.getCommodityTypesCsv();
        if (csv != null && !csv.isBlank()) {
            for (String code : csv.split(",")) {
                Integer id = codeToId.get(code.trim());
                if (id != null) ids.add(id);
            }
        }
        trader.setCommodityTypeIds(ids);
        trader.setCommodityLimits(limitRepository.findByTraderId(trader.getTraderId()));
        return trader;
    }

    @Transactional(readOnly = true)
    public List<Trader> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    @Transactional(readOnly = true)
    public Trader get(Integer id) {
        return hydrate(repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No trader with id " + id + ".")));
    }

    private void normalizeCodeField(Trader input) {
        if (input.getTraderCode() != null) input.setTraderCode(input.getTraderCode().toUpperCase());
    }

    /** Frontend TraderInput never sends limitCurrencyId (not in its type) — default to the system base currency. */
    private void defaultLimitCurrency(Trader input) {
        if (input.getLimitCurrencyId() == null) {
            input.setLimitCurrencyId(currencyRepository.findAll().stream()
                    .filter(c -> Boolean.TRUE.equals(c.getIsBaseCurrency()))
                    .findFirst()
                    .map(c -> c.getCurrencyId())
                    .orElseThrow(() -> new NotFoundException("No base currency configured.")));
        }
    }

    private String commodityTypesToCsv(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) return null;
        Map<Integer, String> idToCode = idToCodeMap();
        return ids.stream().map(idToCode::get).filter(c -> c != null).collect(Collectors.joining(","));
    }

    // null (field absent from the payload) means "leave existing limits
    // alone" — TradersPage.tsx's form has no UI for editing commodityLimits
    // yet, so every real save from today's UI omits the field entirely; only
    // an explicit list (including an explicit empty one) replaces the set.
    private void saveCommodityLimits(Integer traderId, List<TraderCommodityLimit> limits) {
        if (limits == null) return;
        limitRepository.deleteByTraderId(traderId);
        for (TraderCommodityLimit limit : limits) {
            limit.setTraderCommodityLimitId(null);
            limit.setTraderId(traderId);
            limitRepository.save(limit);
        }
    }

    public Trader create(Trader input) {
        normalizeCodeField(input);
        if (repository.existsByTraderCodeIgnoreCase(input.getTraderCode())) {
            throw new ConflictException("Trader Code \"" + input.getTraderCode() + "\" already exists.");
        }
        defaultLimitCurrency(input);
        List<TraderCommodityLimit> limits = input.getCommodityLimits();
        input.setTraderId(null);
        input.setCommodityTypesCsv(commodityTypesToCsv(input.getCommodityTypeIds()));
        Trader saved = repository.save(input);
        saveCommodityLimits(saved.getTraderId(), limits);
        return hydrate(saved);
    }

    public Trader update(Integer id, Trader input) {
        Trader existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No trader with id " + id + "."));
        normalizeCodeField(input);
        defaultLimitCurrency(input);
        List<TraderCommodityLimit> limits = input.getCommodityLimits();
        input.setTraderId(id);
        input.setCommodityTypesCsv(commodityTypesToCsv(input.getCommodityTypeIds()));
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        Trader saved = repository.save(input);
        saveCommodityLimits(id, limits);
        return hydrate(saved);
    }

    public void deactivate(Integer id) {
        Trader existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No trader with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
