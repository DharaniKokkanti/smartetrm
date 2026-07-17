package com.etrm.system.rinaccount;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.legalentity.LegalEntityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class RinAccountService {

    private final RinAccountRepository repository;
    private final LegalEntityRepository legalEntityRepository;

    public RinAccountService(RinAccountRepository repository, LegalEntityRepository legalEntityRepository) {
        this.repository = repository;
        this.legalEntityRepository = legalEntityRepository;
    }

    private RinAccount hydrate(RinAccount account) {
        legalEntityRepository.findById(account.getLegalEntityId())
                .ifPresent(e -> account.setEntityName(e.getEntityName()));
        return account;
    }

    @Transactional(readOnly = true)
    public List<RinAccount> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public RinAccount create(RinAccount input) {
        input.setAccountId(null);
        LocalDateTime now = LocalDateTime.now();
        input.setCreatedAt(now);
        input.setUpdatedAt(now);
        return hydrate(repository.save(input));
    }

    public RinAccount update(Integer id, RinAccount input) {
        RinAccount existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No RIN account with id " + id + "."));
        input.setAccountId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        RinAccount existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No RIN account with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
