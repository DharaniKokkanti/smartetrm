package com.etrm.system.marginvaluation;

import com.etrm.system.clearingaccount.ClearingAccountRepository;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MarginValuationService {

    private final MarginValuationRepository repository;
    private final ClearingAccountRepository clearingAccountRepository;
    private final UnitOfMeasureRepository uomRepository;

    public MarginValuationService(MarginValuationRepository repository,
                                   ClearingAccountRepository clearingAccountRepository,
                                   UnitOfMeasureRepository uomRepository) {
        this.repository = repository;
        this.clearingAccountRepository = clearingAccountRepository;
        this.uomRepository = uomRepository;
    }

    private MarginValuation hydrate(MarginValuation v) {
        clearingAccountRepository.findById(v.getClearingAccountId()).ifPresent(a -> v.setClearingAccountCode(a.getAccountCode()));
        if (v.getVolumeUomId() != null) {
            uomRepository.findById(v.getVolumeUomId()).ifPresent(u -> v.setVolumeUomCode(u.getUomCode()));
        }
        return v;
    }

    @Transactional(readOnly = true)
    public List<MarginValuation> listByClearingAccount(Integer clearingAccountId) {
        return repository.findByClearingAccountIdOrderByValuationDateDesc(clearingAccountId).stream().map(this::hydrate).toList();
    }

    public MarginValuation create(MarginValuation input) {
        input.setMarginValuationId(null);
        return hydrate(repository.save(input));
    }

    public MarginValuation update(Long id, MarginValuation input) {
        MarginValuation existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No margin valuation with id " + id + "."));
        input.setMarginValuationId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        input.setCreatedSrcId(existing.getCreatedSrcId());
        return hydrate(repository.save(input));
    }
}
