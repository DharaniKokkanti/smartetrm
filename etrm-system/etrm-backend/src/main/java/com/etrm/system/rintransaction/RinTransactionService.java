package com.etrm.system.rintransaction;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.lookup.LookupResolutionService;
import com.etrm.system.rinaccount.RinAccountRepository;
import com.etrm.system.rinfuelcategory.RinFuelCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class RinTransactionService {

    private static final String TYPE_CATEGORY = "RIN_TRANSACTION_TYPE";

    private final RinTransactionRepository repository;
    private final RinAccountRepository accountRepository;
    private final RinFuelCategoryRepository fuelCategoryRepository;
    private final CounterpartyRepository counterpartyRepository;
    private final LookupResolutionService lookupResolutionService;

    public RinTransactionService(RinTransactionRepository repository, RinAccountRepository accountRepository,
                                  RinFuelCategoryRepository fuelCategoryRepository,
                                  CounterpartyRepository counterpartyRepository,
                                  LookupResolutionService lookupResolutionService) {
        this.repository = repository;
        this.accountRepository = accountRepository;
        this.fuelCategoryRepository = fuelCategoryRepository;
        this.counterpartyRepository = counterpartyRepository;
        this.lookupResolutionService = lookupResolutionService;
    }

    private void resolveForeignKeys(RinTransaction input) {
        if (input.getTransactionTypeCode() != null) {
            input.setTransactionType(lookupResolutionService.idForCode(TYPE_CATEGORY, input.getTransactionTypeCode()));
        }
    }

    private RinTransaction hydrate(RinTransaction transaction) {
        transaction.setTransactionTypeCode(lookupResolutionService.codeForId(TYPE_CATEGORY, transaction.getTransactionType()));
        accountRepository.findById(transaction.getAccountId())
                .ifPresent(a -> transaction.setAccountName(a.getAccountName()));
        fuelCategoryRepository.findByDCodeIgnoreCase(transaction.getDCode())
                .ifPresent(f -> transaction.setFuelName(f.getFuelName()));
        if (transaction.getCounterpartyId() != null) {
            counterpartyRepository.findById(transaction.getCounterpartyId())
                    .ifPresent(c -> transaction.setCounterpartyName(c.getLegalName()));
        }
        return transaction;
    }

    @Transactional(readOnly = true)
    public List<RinTransaction> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public RinTransaction create(RinTransaction input) {
        resolveForeignKeys(input);
        input.setTransactionId(null);
        input.setCreatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public RinTransaction voidTransaction(Integer id) {
        RinTransaction existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No RIN transaction with id " + id + "."));
        existing.setStatus("VOID");
        return hydrate(repository.save(existing));
    }
}
