package com.etrm.system.commercialterms;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.creditterm.CreditTermRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import com.etrm.system.paymentterm.PaymentTermRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CpCommercialTermsService {

    private final CpCommercialTermsRepository repository;
    private final CounterpartyRepository counterpartyRepository;
    private final LegalEntityRepository legalEntityRepository;
    private final PaymentTermRepository paymentTermRepository;
    private final CreditTermRepository creditTermRepository;

    public CpCommercialTermsService(CpCommercialTermsRepository repository, CounterpartyRepository counterpartyRepository,
                                     LegalEntityRepository legalEntityRepository, PaymentTermRepository paymentTermRepository,
                                     CreditTermRepository creditTermRepository) {
        this.repository = repository;
        this.counterpartyRepository = counterpartyRepository;
        this.legalEntityRepository = legalEntityRepository;
        this.paymentTermRepository = paymentTermRepository;
        this.creditTermRepository = creditTermRepository;
    }

    private CpCommercialTerms hydrate(CpCommercialTerms terms) {
        counterpartyRepository.findById(terms.getCounterpartyId())
                .ifPresent(cp -> terms.setCounterpartyName(cp.getLegalName()));
        legalEntityRepository.findById(terms.getLegalEntityId())
                .ifPresent(le -> terms.setLegalEntityName(le.getEntityName()));
        paymentTermRepository.findById(terms.getPaymentTermId())
                .ifPresent(pt -> terms.setPaymentTermName(pt.getTermName()));
        creditTermRepository.findById(terms.getCreditTermId())
                .ifPresent(ct -> terms.setCreditTermName(ct.getTermName()));
        return terms;
    }

    @Transactional(readOnly = true)
    public List<CpCommercialTerms> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    @Transactional(readOnly = true)
    public CpCommercialTerms get(Integer id) {
        return hydrate(repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No commercial terms with id " + id + ".")));
    }

    public CpCommercialTerms create(CpCommercialTerms input) {
        input.setCpTermsId(null);
        return hydrate(repository.save(input));
    }

    public CpCommercialTerms update(Integer id, CpCommercialTerms input) {
        CpCommercialTerms existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No commercial terms with id " + id + "."));
        input.setCpTermsId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        CpCommercialTerms existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No commercial terms with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
