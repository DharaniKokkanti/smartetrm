package com.etrm.system.settlementprice;

import com.etrm.system.support.ApiTestBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/settlement-prices: create, list, update, and the /confirm
 * action (no deactivate — dbo.settlement_price has no is_active column, see
 * SettlementPrice.java's doc comment). dbo.settlement_price has a composite
 * unique index on (exchange, contract_ticker, settle_date) — contract_ticker
 * uses unique() per test method to avoid collisions.
 */
class SettlementPriceControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private Map<String, Object> validPayload(String ticker, LocalDate settleDate) {
        Integer currencyId = jdbc.queryForObject("SELECT TOP 1 currency_id FROM dbo.currency", Integer.class);
        Integer uomId = jdbc.queryForObject("SELECT TOP 1 uom_id FROM dbo.unit_of_measure", Integer.class);

        Map<String, Object> payload = new HashMap<>();
        payload.put("exchange", "NYMEX");
        payload.put("contractTicker", ticker);
        payload.put("settleDate", settleDate.toString());
        payload.put("settlePrice", 75.25);
        payload.put("tickSize", 0.01);
        payload.put("tickCurrencyId", currencyId);
        payload.put("uomId", uomId);
        payload.put("isConfirmed", false);
        payload.put("source", "EXCHANGE_FEED");
        payload.put("notes", "Test settlement price");
        return payload;
    }

    @Test
    void create_persists_and_hydrates_uomCode() throws Exception {
        String ticker = unique();
        mockMvc.perform(auth(post("/api/v1/settlement-prices")).content(json(validPayload(ticker, LocalDate.of(2026, 1, 1)))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contractTicker").value(ticker))
                .andExpect(jsonPath("$.settlementPriceId").isNumber())
                .andExpect(jsonPath("$.uomCode").isNotEmpty())
                .andExpect(jsonPath("$.isConfirmed").value(false));
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/settlement-prices")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String ticker = unique();
        LocalDate settleDate = LocalDate.of(2026, 1, 2);
        String createBody = mockMvc.perform(auth(post("/api/v1/settlement-prices")).content(json(validPayload(ticker, settleDate))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("settlementPriceId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(ticker, settleDate));
        update.put("settlePrice", 80.5);
        update.put("notes", "Updated settlement price");
        // V131 — echo back the version just read from the create response,
        // same as a real client would; see LegalEntityControllerTest's V127 comment.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/settlement-prices/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.settlePrice").value(80.5))
                .andExpect(jsonPath("$.notes").value("Updated settlement price"));
    }

    @Test
    void confirm_sets_isConfirmed_true() throws Exception {
        String ticker = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/settlement-prices")).content(json(validPayload(ticker, LocalDate.of(2026, 1, 3)))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("settlementPriceId").asInt();

        mockMvc.perform(auth(patch("/api/v1/settlement-prices/" + id + "/confirm")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isConfirmed").value(true));
    }
}
