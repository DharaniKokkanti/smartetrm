package com.etrm.system.contractmarginrate;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ContractMarginRateService {

    private final ContractMarginRateRepository repository;
    private final CurrencyRepository currencyRepository;
    private final JdbcTemplate jdbc;

    public ContractMarginRateService(ContractMarginRateRepository repository,
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

    private ContractMarginRate hydrate(ContractMarginRate r) {
        r.setContractSpecCode(lookupSpecCode(r.getContractSpecId()));
        currencyRepository.findById(r.getMarginCurrencyId()).ifPresent(c -> r.setMarginCurrencyCode(c.getCurrencyCode()));
        return r;
    }

    @Transactional(readOnly = true)
    public List<ContractMarginRate> listByContractSpec(Integer contractSpecId) {
        return repository.findByContractSpecId(contractSpecId).stream().map(this::hydrate).toList();
    }

    public ContractMarginRate create(ContractMarginRate input) {
        input.setContractMarginRateId(null);
        return hydrate(repository.save(input));
    }

    public ContractMarginRate update(Integer id, ContractMarginRate input) {
        ContractMarginRate existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No contract margin rate with id " + id + "."));
        input.setContractMarginRateId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        input.setCreatedSrcId(existing.getCreatedSrcId());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        ContractMarginRate existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No contract margin rate with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
