package com.etrm.system.currency;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/currencies — CurrencyController is a real, dedicated
 * controller with its own CurrencyService (create/update/deactivate), even
 * though dbo.currency is ALSO registered in master_data_table_registry and
 * separately reachable via the generic /api/v1/reference-data/currency path
 * (and thus already swept once by ReferenceDataCrudSmokeTest). The dedicated
 * controller is the one etrm-frontend/src/features/reference/currencies
 * actually calls, so it gets its own real coverage here rather than being
 * treated as redundant.
 */
class CurrencyControllerTest extends ApiTestBase {

    /** CHAR(3) unique code — same technique as CountryControllerTest, one
     *  more letter of entropy. */
    private static String uniqueCurrencyCode() {
        long n = Long.parseLong(unique().substring(1));
        int bucket = (int) (n % 17576);
        char c1 = (char) ('A' + bucket / 676);
        char c2 = (char) ('A' + (bucket / 26) % 26);
        char c3 = (char) ('A' + bucket % 26);
        return "" + c1 + c2 + c3;
    }

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("currencyCode", code);
        payload.put("currencyName", "Test Currency " + code);
        payload.put("symbol", "T$");
        payload.put("decimalPlaces", 2);
        payload.put("isBaseCurrency", false);
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_populates_createdAt() throws Exception {
        String code = uniqueCurrencyCode();
        mockMvc.perform(auth(post("/api/v1/currencies")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.currencyCode").value(code))
                .andExpect(jsonPath("$.currencyId").isNumber())
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    void create_duplicate_currencyCode_returns_409() throws Exception {
        String code = uniqueCurrencyCode();
        mockMvc.perform(auth(post("/api/v1/currencies")).content(json(validPayload(code))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/currencies")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/currencies")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_createdAt() throws Exception {
        String code = uniqueCurrencyCode();
        String createBody = mockMvc.perform(auth(post("/api/v1/currencies")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("currencyId").asInt();
        String originalCreatedAt = objectMapper.readTree(createBody).get("createdAt").asText();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("currencyName", "Updated Currency Name " + code);

        mockMvc.perform(auth(put("/api/v1/currencies/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currencyName").value("Updated Currency Name " + code))
                .andExpect(jsonPath("$.createdAt").value(originalCreatedAt));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = uniqueCurrencyCode();
        String createBody = mockMvc.perform(auth(post("/api/v1/currencies")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("currencyId").asInt();

        mockMvc.perform(auth(patch("/api/v1/currencies/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
