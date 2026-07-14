package com.etrm.system.letterofcredit;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import com.etrm.system.lookup.LcStatusTypeRepository;
import com.etrm.system.lookup.LcTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class LetterOfCreditService {

    private final LetterOfCreditRepository repository;
    private final CounterpartyRepository counterpartyRepository;
    private final LegalEntityRepository legalEntityRepository;
    private final LcTypeRepository lcTypeRepository;
    private final LcStatusTypeRepository lcStatusTypeRepository;

    public LetterOfCreditService(LetterOfCreditRepository repository, CounterpartyRepository counterpartyRepository,
                                  LegalEntityRepository legalEntityRepository, LcTypeRepository lcTypeRepository,
                                  LcStatusTypeRepository lcStatusTypeRepository) {
        this.repository = repository;
        this.counterpartyRepository = counterpartyRepository;
        this.legalEntityRepository = legalEntityRepository;
        this.lcTypeRepository = lcTypeRepository;
        this.lcStatusTypeRepository = lcStatusTypeRepository;
    }

    private LetterOfCredit hydrate(LetterOfCredit lc) {
        counterpartyRepository.findById(lc.getCounterpartyId()).ifPresent(cp -> lc.setCounterpartyName(cp.getLegalName()));
        legalEntityRepository.findById(lc.getBeneficiaryEntityId()).ifPresent(le -> lc.setBeneficiaryEntityName(le.getEntityName()));
        if (lc.getLcTypeId() != null) {
            lcTypeRepository.findById(lc.getLcTypeId()).ifPresent(t -> lc.setLcType(t.getTypeCode()));
        }
        if (lc.getStatusId() != null) {
            lcStatusTypeRepository.findById(lc.getStatusId()).ifPresent(t -> lc.setStatus(t.getTypeCode()));
        }
        lc.setAvailableAmount(lc.getLcAmount().subtract(lc.getDrawdownAmount()));
        return lc;
    }

    private void resolveForeignKeys(LetterOfCredit input) {
        if (input.getLcType() != null) {
            input.setLcTypeId(lcTypeRepository.findByTypeCodeIgnoreCase(input.getLcType())
                    .orElseThrow(() -> new NotFoundException("No LC type \"" + input.getLcType() + "\"."))
                    .getLcTypeId());
        }
        if (input.getStatus() != null) {
            input.setStatusId(lcStatusTypeRepository.findByTypeCodeIgnoreCase(input.getStatus())
                    .orElseThrow(() -> new NotFoundException("No LC status \"" + input.getStatus() + "\"."))
                    .getLcStatusTypeId());
        }
    }

    @Transactional(readOnly = true)
    public List<LetterOfCredit> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public LetterOfCredit create(LetterOfCredit input) {
        resolveForeignKeys(input);
        input.setLcId(null);
        input.setCreatedAt(LocalDateTime.now());
        input.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public LetterOfCredit update(Integer id, LetterOfCredit input) {
        LetterOfCredit existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No letter of credit with id " + id + "."));
        resolveForeignKeys(input);
        input.setLcId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public void cancel(Integer id) {
        LetterOfCredit existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No letter of credit with id " + id + "."));
        existing.setStatusId(lcStatusTypeRepository.findByTypeCodeIgnoreCase("CANCELLED")
                .orElseThrow(() -> new NotFoundException("No LC status \"CANCELLED\"."))
                .getLcStatusTypeId());
        existing.setUpdatedAt(LocalDateTime.now());
        repository.save(existing);
    }
}
