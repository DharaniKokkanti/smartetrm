package com.etrm.system.marginoffsetrule;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.exchange.ExchangeRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MarginOffsetRuleService {

    private final MarginOffsetRuleRepository repository;
    private final ExchangeRepository exchangeRepository;
    private final JdbcTemplate jdbc;

    public MarginOffsetRuleService(MarginOffsetRuleRepository repository, ExchangeRepository exchangeRepository, JdbcTemplate jdbc) {
        this.repository = repository;
        this.exchangeRepository = exchangeRepository;
        this.jdbc = jdbc;
    }

    private String lookupLegLabel(Integer marketProductLinkId) {
        List<String> rows = jdbc.query(
                "SELECT COALESCE(mpl.ticker, m.market_name) AS label FROM dbo.market_product_link mpl "
                        + "JOIN dbo.ref_market m ON mpl.market_id = m.market_id WHERE mpl.market_product_link_id = ?",
                (rs, i) -> rs.getString("label"), marketProductLinkId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private MarginOffsetRule hydrate(MarginOffsetRule r) {
        exchangeRepository.findById(r.getExchangeId()).ifPresent(e -> r.setExchangeCode(e.getExchangeCode()));
        r.setLeg1Label(lookupLegLabel(r.getLeg1MarketProductLinkId()));
        r.setLeg2Label(lookupLegLabel(r.getLeg2MarketProductLinkId()));
        return r;
    }

    @Transactional(readOnly = true)
    public List<MarginOffsetRule> listByExchange(Integer exchangeId) {
        return repository.findByExchangeId(exchangeId).stream().map(this::hydrate).toList();
    }

    public MarginOffsetRule create(MarginOffsetRule input) {
        input.setMarginOffsetRuleId(null);
        return hydrate(repository.save(input));
    }

    public MarginOffsetRule update(Integer id, MarginOffsetRule input) {
        MarginOffsetRule existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No margin offset rule with id " + id + "."));
        input.setMarginOffsetRuleId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        input.setCreatedSrcId(existing.getCreatedSrcId());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        MarginOffsetRule existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No margin offset rule with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
