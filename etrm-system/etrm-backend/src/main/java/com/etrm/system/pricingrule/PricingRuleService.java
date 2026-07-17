package com.etrm.system.pricingrule;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.formulatemplate.FormulaTemplateRepository;
import com.etrm.system.lookup.PricingTypeRepository;
import com.etrm.system.priceindex.PriceIndexRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * See PricingRule.java's class doc comment for the full list of frontend/DB
 * mismatches this service reconciles (differentialUomCode/
 * pricingCalendarCode/publicationSource/balmoExchange/balmoSeries/
 * balmoTickSize have no DB column and are always null; formulaExpression/
 * averagingMethod are best-effort sourced from the linked formula_template
 * row, not real pricing_rule columns).
 */
@Service
@Transactional
public class PricingRuleService {

    private final PricingRuleRepository repository;
    private final PricingTypeRepository pricingTypeRepository;
    private final PriceIndexRepository priceIndexRepository;
    private final FormulaTemplateRepository formulaTemplateRepository;
    private final CurrencyRepository currencyRepository;

    public PricingRuleService(PricingRuleRepository repository,
                               PricingTypeRepository pricingTypeRepository,
                               PriceIndexRepository priceIndexRepository,
                               FormulaTemplateRepository formulaTemplateRepository,
                               CurrencyRepository currencyRepository) {
        this.repository = repository;
        this.pricingTypeRepository = pricingTypeRepository;
        this.priceIndexRepository = priceIndexRepository;
        this.formulaTemplateRepository = formulaTemplateRepository;
        this.currencyRepository = currencyRepository;
    }

    private PricingRule hydrate(PricingRule rule) {
        pricingTypeRepository.findById(rule.getPricingTypeId())
                .ifPresent(pt -> rule.setPricingType(pt.getTypeCode()));
        if (rule.getPriceIndexId() != null) {
            priceIndexRepository.findById(rule.getPriceIndexId())
                    .ifPresent(idx -> rule.setPriceIndexCode(idx.getIndexCode()));
        }
        if (rule.getDifferentialCurrencyId() != null) {
            currencyRepository.findById(rule.getDifferentialCurrencyId())
                    .ifPresent(cur -> rule.setDifferentialCurrencyCode(cur.getCurrencyCode()));
        }
        if (rule.getFormulaTemplateId() != null) {
            formulaTemplateRepository.findById(rule.getFormulaTemplateId()).ifPresent(tpl -> {
                rule.setFormulaExpression(tpl.getFormulaExpression());
                rule.setAveragingMethod(tpl.getAveragingType());
            });
        }
        return rule;
    }

    @Transactional(readOnly = true)
    public List<PricingRule> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public PricingRule create(PricingRule input) {
        input.setPricingRuleId(null);
        return hydrate(repository.save(input));
    }

    public PricingRule update(Integer id, PricingRule input) {
        PricingRule existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No pricing rule with id " + id + "."));
        input.setPricingRuleId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        PricingRule existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No pricing rule with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
