package com.etrm.system.rintransaction;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/rin-transactions: create, list, void, unauthenticated
 * access. No PUT/update endpoint — frontend api.ts only has
 * list/create/void.
 *
 * Regression coverage for a real bug found while first writing this suite:
 * same root cause as CarbonRegistryControllerTest — RinTransaction
 * .transactionType (raw int FK into lookup_value) carried @NotNull on the
 * field but its getter/setter are @JsonIgnore; only the denormalized
 * transactionTypeCode string (aliased to the same JSON key) is reachable
 * from JSON. Bean Validation ran before
 * RinTransactionService.resolveForeignKeys() populated the int field, so
 * every real POST 400'd unconditionally. Fixed by dropping @NotNull from
 * transactionType.
 */
class RinTransactionControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private Integer freshAccountId() throws Exception {
        String code = unique();
        Integer legalEntityId = jdbc.queryForObject("SELECT TOP 1 legal_entity_id FROM dbo.legal_entity", Integer.class);
        Map<String, Object> account = new HashMap<>();
        account.put("legalEntityId", legalEntityId);
        account.put("epaCompanyId", "EPA-" + code);
        account.put("accountCode", code);
        account.put("accountName", "Test Account " + code);
        account.put("accountType", "TRADING");
        String body = mockMvc.perform(auth(post("/api/v1/rin-accounts")).content(json(account)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("accountId").asInt();
    }

    private Map<String, Object> validPayload(Integer accountId, String dCode) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("transactionType", "GENERATE");
        payload.put("transactionDate", "2026-01-15");
        payload.put("accountId", accountId);
        payload.put("dCode", dCode);
        payload.put("vintageYear", 2026);
        payload.put("quantity", 5000);
        payload.put("pricePerRin", new BigDecimal("0.850000"));
        payload.put("status", "PENDING");
        return payload;
    }

    private int createTransaction() throws Exception {
        Integer accountId = freshAccountId();
        String dCode = jdbc.queryForObject("SELECT TOP 1 d_code FROM dbo.rin_fuel_category", String.class);
        String body = mockMvc.perform(auth(post("/api/v1/rin-transactions")).content(json(validPayload(accountId, dCode))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("transactionId").asInt();
    }

    @Test
    void create_persists_and_resolves_transactionType_code() throws Exception {
        Integer accountId = freshAccountId();
        String dCode = jdbc.queryForObject("SELECT TOP 1 d_code FROM dbo.rin_fuel_category", String.class);

        mockMvc.perform(auth(post("/api/v1/rin-transactions")).content(json(validPayload(accountId, dCode))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.transactionId").isNumber())
                .andExpect(jsonPath("$.transactionType").value("GENERATE"))
                .andExpect(jsonPath("$.accountName").isNotEmpty());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/rin-transactions")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void void_sets_status_to_VOID() throws Exception {
        int id = createTransaction();

        mockMvc.perform(auth(patch("/api/v1/rin-transactions/" + id + "/void")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VOID"));
    }

    @Test
    void void_nonexistent_id_returns_404() throws Exception {
        mockMvc.perform(auth(patch("/api/v1/rin-transactions/999999999/void")))
                .andExpect(status().isNotFound());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/rin-transactions"))
                .andExpect(status().isForbidden());
    }
}
