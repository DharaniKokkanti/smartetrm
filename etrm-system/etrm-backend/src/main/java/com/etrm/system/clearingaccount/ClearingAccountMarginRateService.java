package com.etrm.system.clearingaccount;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ClearingAccountMarginRateService {

    private final ClearingAccountMarginRateRepository repository;
    private final CurrencyRepository currencyRepository;
    private final JdbcTemplate jdbc;

    public ClearingAccountMarginRateService(ClearingAccountMarginRateRepository repository,
                                             CurrencyRepository currencyRepository, JdbcTemplate jdbc) {
        this.repository = repository;
        this.currencyRepository = currencyRepository;
        this.jdbc = jdbc;
    }

    // derivative_contract_specification has no JPA entity (schema-only
    // outside this table's own needs) — a plain JdbcTemplate lookup is
    // simpler than adding one just to resolve a display code.
    private String lookupSpecCode(Integer contractSpecId) {
        List<String> rows = jdbc.query(
                "SELECT spec_code FROM dbo.derivative_contract_specification WHERE contract_spec_id = ?",
                (rs, i) -> rs.getString("spec_code"), contractSpecId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private ClearingAccountMarginRate hydrate(ClearingAccountMarginRate r) {
        r.setContractSpecCode(lookupSpecCode(r.getContractSpecId()));
        currencyRepository.findById(r.getMarginCurrencyId()).ifPresent(c -> r.setMarginCurrencyCode(c.getCurrencyCode()));
        return r;
    }

    @Transactional(readOnly = true)
    public List<ClearingAccountMarginRate> listByClearingAccount(Integer clearingAccountId) {
        return repository.findByClearingAccountId(clearingAccountId).stream().map(this::hydrate).toList();
    }

    public ClearingAccountMarginRate create(ClearingAccountMarginRate input) {
        input.setClearingAccountMarginRateId(null);
        return hydrate(repository.save(input));
    }

    public ClearingAccountMarginRate update(Integer id, ClearingAccountMarginRate input) {
        ClearingAccountMarginRate existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No clearing account margin rate with id " + id + "."));
        input.setClearingAccountMarginRateId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        input.setCreatedSrcId(existing.getCreatedSrcId());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        ClearingAccountMarginRate existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No clearing account margin rate with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
