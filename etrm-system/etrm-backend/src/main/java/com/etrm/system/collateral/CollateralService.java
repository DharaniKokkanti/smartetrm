package com.etrm.system.collateral;

import com.etrm.system.collateraltype.CollateralTypeRepository;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CollateralService {

    private final CollateralRepository repository;
    private final CollateralTypeRepository collateralTypeRepository;
    private final LegalEntityRepository legalEntityRepository;
    private final CounterpartyRepository counterpartyRepository;
    private final CurrencyRepository currencyRepository;

    public CollateralService(CollateralRepository repository, CollateralTypeRepository collateralTypeRepository,
                              LegalEntityRepository legalEntityRepository, CounterpartyRepository counterpartyRepository,
                              CurrencyRepository currencyRepository) {
        this.repository = repository;
        this.collateralTypeRepository = collateralTypeRepository;
        this.legalEntityRepository = legalEntityRepository;
        this.counterpartyRepository = counterpartyRepository;
        this.currencyRepository = currencyRepository;
    }

    private Collateral hydrate(Collateral c) {
        collateralTypeRepository.findById(c.getCollateralTypeId()).ifPresent(t -> c.setCollateralTypeName(t.getTypeName()));
        legalEntityRepository.findById(c.getLegalEntityId()).ifPresent(le -> c.setLegalEntityName(le.getEntityName()));
        if (c.getCounterpartyId() != null) {
            counterpartyRepository.findById(c.getCounterpartyId()).ifPresent(cp -> c.setCounterpartyName(cp.getLegalName()));
        }
        currencyRepository.findById(c.getCurrencyId()).ifPresent(cur -> c.setCurrencyCode(cur.getCurrencyCode()));
        return c;
    }

    @Transactional(readOnly = true)
    public List<Collateral> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Collateral create(Collateral input) {
        input.setCollateralId(null);
        return hydrate(repository.save(input));
    }

    public Collateral update(Integer id, Collateral input) {
        Collateral existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No collateral with id " + id + "."));
        input.setCollateralId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }
}
