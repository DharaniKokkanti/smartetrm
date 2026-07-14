package com.etrm.system.creditlimit;

import com.etrm.system.auth.AppUserRepository;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.lookup.CreditLimitStatusTypeRepository;
import com.etrm.system.lookup.CreditLimitTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class CreditLimitService {

    private final CreditLimitRepository repository;
    private final CreditLimitLineItemRepository lineItemRepository;
    private final CreditLimitAlertRepository alertRepository;
    private final CounterpartyRepository counterpartyRepository;
    private final AppUserRepository appUserRepository;
    private final CreditLimitTypeRepository limitTypeRepository;
    private final CreditLimitStatusTypeRepository statusTypeRepository;

    public CreditLimitService(CreditLimitRepository repository, CreditLimitLineItemRepository lineItemRepository,
                               CreditLimitAlertRepository alertRepository, CounterpartyRepository counterpartyRepository,
                               AppUserRepository appUserRepository, CreditLimitTypeRepository limitTypeRepository,
                               CreditLimitStatusTypeRepository statusTypeRepository) {
        this.repository = repository;
        this.lineItemRepository = lineItemRepository;
        this.alertRepository = alertRepository;
        this.counterpartyRepository = counterpartyRepository;
        this.appUserRepository = appUserRepository;
        this.limitTypeRepository = limitTypeRepository;
        this.statusTypeRepository = statusTypeRepository;
    }

    private CreditLimit hydrate(CreditLimit cl) {
        counterpartyRepository.findById(cl.getCounterpartyId()).ifPresent(cp -> cl.setCounterpartyName(cp.getLegalName()));
        if (cl.getCreditAnalystUserId() != null) {
            appUserRepository.findById(cl.getCreditAnalystUserId()).ifPresent(u -> cl.setCreditAnalystName(u.getFullName()));
        }
        if (cl.getLimitTypeId() != null) {
            limitTypeRepository.findById(cl.getLimitTypeId()).ifPresent(t -> cl.setLimitType(t.getTypeCode()));
        }
        if (cl.getStatusId() != null) {
            statusTypeRepository.findById(cl.getStatusId()).ifPresent(t -> cl.setStatus(t.getTypeCode()));
        }

        BigDecimal uplift = cl.getTempUpliftAmount() != null ? cl.getTempUpliftAmount() : BigDecimal.ZERO;
        BigDecimal available = cl.getLimitAmount().add(uplift).add(cl.getCollateralOffset()).subtract(cl.getUsedAmount());
        cl.setAvailableAmount(available);

        BigDecimal utilisationPct = cl.getLimitAmount().compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : cl.getUsedAmount().divide(cl.getLimitAmount(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        cl.setUtilisationPct(utilisationPct);

        String indicator;
        if (utilisationPct.compareTo(BigDecimal.valueOf(100)) >= 0) {
            indicator = "BREACHED";
        } else if (utilisationPct.compareTo(cl.getCriticalThresholdPct()) >= 0) {
            indicator = "CRITICAL";
        } else if (utilisationPct.compareTo(cl.getWarningThresholdPct()) >= 0) {
            indicator = "WARNING";
        } else {
            indicator = "OK";
        }
        cl.setLimitIndicator(indicator);

        cl.setLineItems(lineItemRepository.findByCreditLimitId(cl.getCreditLimitId()));
        cl.setAlerts(alertRepository.findByCreditLimitId(cl.getCreditLimitId()));
        return cl;
    }

    private void resolveForeignKeys(CreditLimit input) {
        if (input.getLimitType() != null) {
            input.setLimitTypeId(limitTypeRepository.findByTypeCodeIgnoreCase(input.getLimitType())
                    .orElseThrow(() -> new NotFoundException("No credit limit type \"" + input.getLimitType() + "\"."))
                    .getCreditLimitTypeId());
        }
        if (input.getStatus() != null) {
            input.setStatusId(statusTypeRepository.findByTypeCodeIgnoreCase(input.getStatus())
                    .orElseThrow(() -> new NotFoundException("No credit limit status \"" + input.getStatus() + "\"."))
                    .getCreditLimitStatusTypeId());
        }
    }

    // null (field absent) means "leave existing line items alone" — same
    // convention as TraderService.saveCommodityLimits.
    private void saveLineItems(Integer creditLimitId, List<CreditLimitLineItem> lineItems) {
        if (lineItems == null) return;
        lineItemRepository.deleteByCreditLimitId(creditLimitId);
        for (CreditLimitLineItem item : lineItems) {
            item.setLineItemId(null);
            item.setCreditLimitId(creditLimitId);
            item.setCreatedAt(LocalDateTime.now());
            item.setUpdatedAt(LocalDateTime.now());
            lineItemRepository.save(item);
        }
    }

    @Transactional(readOnly = true)
    public List<CreditLimit> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public CreditLimit create(CreditLimit input) {
        resolveForeignKeys(input);
        List<CreditLimitLineItem> lineItems = input.getLineItems();
        input.setCreditLimitId(null);
        input.setCreatedAt(LocalDateTime.now());
        input.setUpdatedAt(LocalDateTime.now());
        CreditLimit saved = repository.save(input);
        saveLineItems(saved.getCreditLimitId(), lineItems);
        return hydrate(saved);
    }

    public CreditLimit update(Integer id, CreditLimit input) {
        CreditLimit existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No credit limit with id " + id + "."));
        resolveForeignKeys(input);
        List<CreditLimitLineItem> lineItems = input.getLineItems();
        input.setCreditLimitId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setUpdatedAt(LocalDateTime.now());
        CreditLimit saved = repository.save(input);
        saveLineItems(id, lineItems);
        return hydrate(saved);
    }

    private void setStatusByCode(CreditLimit cl, String code) {
        cl.setStatusId(statusTypeRepository.findByTypeCodeIgnoreCase(code)
                .orElseThrow(() -> new NotFoundException("No credit limit status \"" + code + "\"."))
                .getCreditLimitStatusTypeId());
        cl.setUpdatedAt(LocalDateTime.now());
        repository.save(cl);
    }

    public void suspend(Integer id) {
        setStatusByCode(repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No credit limit with id " + id + ".")), "SUSPENDED");
    }

    public void reinstate(Integer id) {
        setStatusByCode(repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No credit limit with id " + id + ".")), "ACTIVE");
    }
}
