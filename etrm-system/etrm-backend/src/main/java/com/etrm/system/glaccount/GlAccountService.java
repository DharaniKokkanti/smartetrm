package com.etrm.system.glaccount;

import com.etrm.system.book.BookRepository;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.costcenter.CostCenterRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import com.etrm.system.lookup.LookupResolutionService;
import com.etrm.system.taxcode.TaxCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class GlAccountService {

    private static final String ACCOUNT_TYPE_CATEGORY = "GL_ACCOUNT_TYPE";

    private final GlAccountRepository repository;
    private final LegalEntityRepository legalEntityRepository;
    private final BookRepository bookRepository;
    private final CostCenterRepository costCenterRepository;
    private final TaxCodeRepository taxCodeRepository;
    private final LookupResolutionService lookupResolutionService;

    public GlAccountService(GlAccountRepository repository, LegalEntityRepository legalEntityRepository,
                             BookRepository bookRepository, CostCenterRepository costCenterRepository,
                             TaxCodeRepository taxCodeRepository, LookupResolutionService lookupResolutionService) {
        this.repository = repository;
        this.legalEntityRepository = legalEntityRepository;
        this.bookRepository = bookRepository;
        this.costCenterRepository = costCenterRepository;
        this.taxCodeRepository = taxCodeRepository;
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
        if (account.getCostCenterId() != null) {
            costCenterRepository.findById(account.getCostCenterId())
                    .ifPresent(c -> account.setCostCenterCode(c.getCostCenterCode()));
        }
        if (account.getDefaultTaxCodeId() != null) {
            taxCodeRepository.findById(account.getDefaultTaxCodeId())
                    .ifPresent(t -> account.setDefaultTaxCode(t.getTaxCode()));
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
        return hydrate(repository.save(input));
    }

    public GlAccount update(Integer id, GlAccount input) {
        GlAccount existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No GL account with id " + id + "."));
        resolveForeignKeys(input);
        input.setAccountId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing
        // only populates those on insert, so the request body never carries
        // them; without copying them from the existing row here, updatable=
        // false keeps the DB value untouched but the response would show
        // them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        GlAccount existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No GL account with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
