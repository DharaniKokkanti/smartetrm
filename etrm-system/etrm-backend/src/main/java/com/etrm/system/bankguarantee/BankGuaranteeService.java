package com.etrm.system.bankguarantee;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BankGuaranteeService {

    private final BankGuaranteeRepository repository;
    private final CounterpartyRepository counterpartyRepository;
    private final LegalEntityRepository legalEntityRepository;
    private final CurrencyRepository currencyRepository;

    public BankGuaranteeService(BankGuaranteeRepository repository, CounterpartyRepository counterpartyRepository,
                                 LegalEntityRepository legalEntityRepository, CurrencyRepository currencyRepository) {
        this.repository = repository;
        this.counterpartyRepository = counterpartyRepository;
        this.legalEntityRepository = legalEntityRepository;
        this.currencyRepository = currencyRepository;
    }

    private BankGuarantee hydrate(BankGuarantee bg) {
        counterpartyRepository.findById(bg.getIssuingBankId()).ifPresent(cp -> bg.setIssuingBankName(cp.getLegalName()));
        legalEntityRepository.findById(bg.getPrincipalEntityId()).ifPresent(le -> bg.setPrincipalEntityName(le.getEntityName()));
        counterpartyRepository.findById(bg.getBeneficiaryCpId()).ifPresent(cp -> bg.setBeneficiaryCpName(cp.getLegalName()));
        currencyRepository.findById(bg.getCurrencyId()).ifPresent(c -> bg.setCurrencyCode(c.getCurrencyCode()));
        return bg;
    }

    @Transactional(readOnly = true)
    public List<BankGuarantee> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public BankGuarantee create(BankGuarantee input) {
        input.setBgId(null);
        return hydrate(repository.save(input));
    }

    public BankGuarantee update(Integer id, BankGuarantee input) {
        BankGuarantee existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No bank guarantee with id " + id + "."));
        input.setBgId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }
}
