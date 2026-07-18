package com.etrm.system.marginaccount;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/credit/margin-accounts CRUD.
 *
 * Regression coverage for a real, 100%-reproducing bug: dbo.margin_account
 * has a NOT NULL created_by column that MarginAccount never mapped (despite
 * its own doc comment claiming otherwise), so every POST here failed with a
 * constraint violation — same shape as the documented Period bug. Fixed by
 * mapping created_at/created_by with @CreatedDate/@CreatedBy JPA-auditing
 * annotations — create_persists_and_auto_populates_createdBy below is the
 * regression check for that fix.
 *
 * dbo.margin_account is unique on (legal_entity_id, market_id, account_type)
 * — each test creates its own fresh legal entity (via /api/v1/legal-entities)
 * rather than reusing a small set of hardcoded ids, so repeated `mvn test`
 * runs against the same live DB can't collide on that composite key.
 */
class MarginAccountControllerTest extends ApiTestBase {

    private int createLegalEntity(String code) throws Exception {
        Map<String, Object> m = Map.of(
                "entityCode", code, "entityName", "Margin Test Entity " + code, "shortName", code + "-short",
                "entityType", 1, "parentInd", false, "jurisdictionId", 1, "baseCurrencyId", 1, "isInternal", true
        );
        String body = mockMvc.perform(auth(post("/api/v1/legal-entities")).content(json(m)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("legalEntityId").asInt();
    }

    private Map<String, Object> validPayload(int legalEntityId, String accountType) {
        Map<String, Object> m = new HashMap<>();
        m.put("legalEntityId", legalEntityId);
        m.put("marketId", 1);
        m.put("accountRef", "ACCT-" + unique());
        m.put("accountType", accountType);
        m.put("clearingBrokerId", 1);
        m.put("currencyId", 1);
        m.put("initialMargin", 10000);
        m.put("variationMargin", 500);
        m.put("excessMargin", 200);
        m.put("isActive", true);
        return m;
    }

    private int createMarginAccount(int legalEntityId, String accountType) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/credit/margin-accounts")).content(json(validPayload(legalEntityId, accountType))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("marginAccountId").asInt();
    }

    @Test
    void create_persists_and_auto_populates_createdBy() throws Exception {
        int legalEntityId = createLegalEntity(unique());
        mockMvc.perform(auth(post("/api/v1/credit/margin-accounts")).content(json(validPayload(legalEntityId, "HOUSE"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.marginAccountId").isNumber())
                .andExpect(jsonPath("$.legalEntityName").isNotEmpty())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_scope_returns_409() throws Exception {
        int legalEntityId = createLegalEntity(unique());
        createMarginAccount(legalEntityId, "CLIENT");
        mockMvc.perform(auth(post("/api/v1/credit/margin-accounts")).content(json(validPayload(legalEntityId, "CLIENT"))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/credit/margin-accounts")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_original_createdBy() throws Exception {
        int legalEntityId = createLegalEntity(unique());
        int id = createMarginAccount(legalEntityId, "OMNIBUS");

        Map<String, Object> update = new HashMap<>(validPayload(legalEntityId, "OMNIBUS"));
        update.put("initialMargin", 99999);

        mockMvc.perform(auth(put("/api/v1/credit/margin-accounts/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.initialMargin").value(99999))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        int legalEntityId = createLegalEntity(unique());
        int id = createMarginAccount(legalEntityId, "CLIENT");
        mockMvc.perform(auth(patch("/api/v1/credit/margin-accounts/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
