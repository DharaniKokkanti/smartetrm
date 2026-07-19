package com.etrm.system.collateral;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Covers /api/v1/credit/collateral CRUD (dbo.collateral extends AuditableEntity, no unique key besides PK). */
class CollateralControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload() {
        Map<String, Object> m = new HashMap<>();
        m.put("collateralTypeId", 1); // CASH_USD
        m.put("direction", "POSTED");
        m.put("securedEntityType", "COUNTERPARTY");
        m.put("securedEntityId", 1);
        m.put("legalEntityId", 1);
        m.put("counterpartyId", 2);
        m.put("currencyId", 1);
        m.put("faceValue", 100000);
        m.put("haircutPct", 5);
        m.put("postingDate", "2026-01-01");
        m.put("status", "ACTIVE");
        return m;
    }

    private int createCollateral() throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/credit/collateral")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("collateralId").asInt();
    }

    @Test
    void create_persists_and_auto_populates_createdBy() throws Exception {
        mockMvc.perform(auth(post("/api/v1/credit/collateral")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.collateralId").isNumber())
                .andExpect(jsonPath("$.collateralTypeName").isNotEmpty())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_missing_required_legalEntityId_returns_400() throws Exception {
        Map<String, Object> payload = validPayload();
        payload.remove("legalEntityId");
        mockMvc.perform(auth(post("/api/v1/credit/collateral")).content(json(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/credit/collateral")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_original_createdBy() throws Exception {
        String createBody = mockMvc.perform(auth(post("/api/v1/credit/collateral")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("collateralId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload());
        update.put("status", "RETURNED");
        // V128 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/credit/collateral/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETURNED"))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }
}
