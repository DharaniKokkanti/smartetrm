package com.etrm.system.glaccount;

import com.etrm.system.book.BookRepository;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.legalentity.LegalEntityRepository;
import com.etrm.system.lookup.LookupResolutionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class GlAccountService {

    private static final String ACCOUNT_TYPE_CATEGORY = "GL_ACCOUNT_TYPE";

    private final GlAccountRepository repository;
    private final LegalEntityRepository legalEntityRepository;
    private final BookRepository bookRepository;
    private final LookupResolutionService lookupResolutionService;

    public GlAccountService(GlAccountRepository repository, LegalEntityRepository legalEntityRepository,
                             BookRepository bookRepository, LookupResolutionService lookupResolutionService) {
        this.repository = repository;
        this.legalEntityRepository = legalEntityRepository;
        this.bookRepository = bookRepository;
        this.lookupResolutionService = lookupResolutionService;
    }

    /** Resolves the frontend's accountTypeCode string back to the FK id the DB actually stores. */
    private void resolveForeignKeys(GlAccount account) {
        if (account.getAccountTypeCode() != null) {
            account.setAccountType(lookupResolutionService.idForCode(ACCOUNT_TYPE_CATEGORY, account.getAccountTypeCode()));
        }
    }

    private GlAccount hydrate(GlAccount account) {
        if (account.getAccountType() != null) {
            account.setAccountTypeCode(lookupResolutionService.codeForId(ACCOUNT_TYPE_CATEGORY, account.getAccountType()));
        }
        if (account.getLegalEntityId() != null) {
            legalEntityRepository.findById(account.getLegalEntityId())
                    .ifPresent(e -> account.setLegalEntityCode(e.getEntityCode()));
        }
        if (account.getBookId() != null) {
            bookRepository.findById(account.getBookId())
                    .ifPresent(b -> account.setBookCode(b.getBookCode()));
        }
        if (account.getParentAccountId() != null) {
            repository.findById(account.getParentAccountId())
                    .ifPresent(p -> account.setParentAccountCode(p.getAccountCode()));
        }
        return account;
    }

    @Transactional(readOnly = true)
    public List<GlAccount> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public GlAccount create(GlAccount input) {
        resolveForeignKeys(input);
        input.setAccountId(null);
        LocalDateTime now = LocalDateTime.now();
        input.setCreatedAt(now);
        input.setUpdatedAt(now);
        return hydrate(repository.save(input));
    }

    public GlAccount update(Integer id, GlAccount input) {
        GlAccount existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No GL account with id " + id + "."));
        resolveForeignKeys(input);
        input.setAccountId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        GlAccount existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No GL account with id " + id + "."));
        existing.setIsActive(false);
        existing.setUpdatedAt(LocalDateTime.now());
        repository.save(existing);
    }
}
