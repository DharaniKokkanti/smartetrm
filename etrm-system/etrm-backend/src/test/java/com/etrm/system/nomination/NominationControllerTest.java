package com.etrm.system.nomination;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/operations/nominations (create/update only — no delete or
 * status-transition endpoints exist) plus a 200-only sanity check on the
 * deliberately-stubbed /trade-order-options endpoint.
 *
 * dbo.nomination.order_id is NOT NULL with a real FK (fk_nomination_order)
 * to dbo.trade_order, but dbo.trade / dbo.trade_order are both completely
 * empty in this environment (no TradeOrder JPA entity/seed exists anywhere
 * in this codebase yet, per Nomination.java's own doc comment). So a minimal
 * trade + trade_order fixture is inserted directly via JdbcTemplate in
 * @BeforeEach (bypassing the app layer, since there is no TradeOrder
 * repository to go through) and torn down in @AfterEach.
 */
class NominationControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private Integer fixtureTradeId;
    private Integer fixtureOrderId;

    @BeforeEach
    void createOrderFixture() {
        Integer uomId = jdbc.queryForObject("SELECT TOP 1 uom_id FROM dbo.unit_of_measure", Integer.class);
        Integer currencyId = jdbc.queryForObject("SELECT TOP 1 currency_id FROM dbo.currency", Integer.class);
        Integer counterpartyId = jdbc.queryForObject("SELECT TOP 1 counterparty_id FROM dbo.counterparty", Integer.class);
        Integer traderId = jdbc.queryForObject("SELECT TOP 1 trader_id FROM dbo.trader", Integer.class);
        Integer legalEntityId = jdbc.queryForObject("SELECT TOP 1 legal_entity_id FROM dbo.legal_entity", Integer.class);
        Integer bookId = jdbc.queryForObject("SELECT TOP 1 book_id FROM dbo.book", Integer.class);
        Integer dealTypeId = jdbc.queryForObject("SELECT TOP 1 deal_type_id FROM dbo.deal_type", Integer.class);
        String ref = "FIXTURE-" + unique();

        // dbo.trade is a system-versioned temporal table — valid_from/valid_to are
        // GENERATED ALWAYS period columns and must NOT be assigned explicitly.
        fixtureTradeId = jdbc.queryForObject(
                "INSERT INTO dbo.trade (trade_reference, trade_date, commodity_type, direction, uom_id, currency_id, " +
                        "counterparty_id, trader_id, status, amendment_number, is_latest_version, created_at, created_by, " +
                        "updated_at, updated_by, trade_type, term_type, deal_indicator, hedge_flag) " +
                        "OUTPUT INSERTED.trade_id " +
                        "VALUES (?, '2026-07-01', 'OIL', 'BUY', ?, ?, ?, ?, 'DRAFT', 0, 1, SYSUTCDATETIME(), 'test-fixture', " +
                        "SYSUTCDATETIME(), 'test-fixture', ?, 'SPOT', 'INTERNAL', 0)",
                Integer.class, ref, uomId, currencyId, counterpartyId, traderId, dealTypeId);

        fixtureOrderId = jdbc.queryForObject(
                "INSERT INTO dbo.trade_order (trade_id, order_sequence, order_reference, status, risk_start_date, " +
                        "risk_end_date, quantity, settlement_type, created_at, updated_at, is_template, legal_entity_id, " +
                        "book_id, uom_id, currency_id, tolerance_for_scheduling) " +
                        "OUTPUT INSERTED.order_id " +
                        "VALUES (?, 1, ?, 'WORKING', '2026-08-01', '2026-08-05', 1000, 'PHYSICAL', SYSUTCDATETIME(), " +
                        "SYSUTCDATETIME(), 0, ?, ?, ?, ?, 0)",
                Integer.class, fixtureTradeId, ref, legalEntityId, bookId, uomId, currencyId);
    }

    @AfterEach
    void deleteOrderFixture() {
        if (fixtureOrderId != null) {
            jdbc.update("DELETE FROM dbo.nomination WHERE order_id = ?", fixtureOrderId);
            jdbc.update("DELETE FROM dbo.trade_order WHERE order_id = ?", fixtureOrderId);
        }
        if (fixtureTradeId != null) {
            jdbc.update("DELETE FROM dbo.trade WHERE trade_id = ?", fixtureTradeId);
        }
    }

    private Map<String, Object> validPayload(String reference) {
        Integer uomId = jdbc.queryForObject("SELECT TOP 1 uom_id FROM dbo.unit_of_measure", Integer.class);
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", fixtureOrderId);
        payload.put("nominationReference", reference);
        payload.put("nominationType", "PIPELINE");
        payload.put("status", "DRAFT");
        payload.put("nominatedQuantity", 1000.0);
        payload.put("uomId", uomId);
        payload.put("nominationWindowStart", "2026-08-01");
        payload.put("nominationWindowEnd", "2026-08-05");
        return payload;
    }

    @Test
    void create_persists_and_returns_201() throws Exception {
        String ref = unique();
        mockMvc.perform(auth(post("/api/v1/operations/nominations")).content(json(validPayload(ref))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nominationReference").value(ref))
                .andExpect(jsonPath("$.nominationId").isNumber())
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/operations/nominations")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String ref = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/operations/nominations")).content(json(validPayload(ref))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("nominationId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(ref));
        update.put("status", "SUBMITTED");

        mockMvc.perform(auth(put("/api/v1/operations/nominations/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"));
    }

    @Test
    void update_nonexistent_id_returns_404() throws Exception {
        mockMvc.perform(auth(put("/api/v1/operations/nominations/999999999")).content(json(validPayload(unique()))))
                .andExpect(status().isNotFound());
    }

    @Test
    void tradeOrderOptions_stub_returns_200_and_empty_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/operations/trade-order-options")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/operations/nominations"))
                .andExpect(status().isForbidden());
    }
}
