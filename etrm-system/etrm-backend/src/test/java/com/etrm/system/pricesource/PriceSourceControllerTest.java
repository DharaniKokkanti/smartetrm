package com.etrm.system.pricesource;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Covers /api/v1/price-sources: create, list, update, deactivate. */
class PriceSourceControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("sourceCode", code);
        payload.put("sourceName", "Test Price Source " + code);
        payload.put("sourceType", "REUTERS");
        payload.put("deliveryMethod", "API");
        payload.put("frequency", "EOD");
        payload.put("timezone", "UTC");
        payload.put("baseUrl", "https://example.com/api");
        payload.put("slaMinutes", 30);
        payload.put("isActive", true);
        payload.put("notes", "Test source");
        return payload;
    }

    @Test
    void create_persists_and_returns_201() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/price-sources")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sourceCode").value(code))
                .andExpect(jsonPath("$.priceSourceId").isNumber())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/price-sources")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/price-sources")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("priceSourceId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("sourceName", "Updated Price Source " + code);
        update.put("frequency", "INTRADAY");
        // V131 — echo back the version just read from the create response,
        // same as a real client would; see LegalEntityControllerTest's V127 comment.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/price-sources/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sourceName").value("Updated Price Source " + code))
                .andExpect(jsonPath("$.frequency").value("INTRADAY"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/price-sources")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("priceSourceId").asInt();

        mockMvc.perform(auth(patch("/api/v1/price-sources/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
