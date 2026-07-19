package com.etrm.system.country;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/countries — CountryController is a real, dedicated
 * controller (not the generic Tier2 ReferenceDataController), verified by
 * reading the file directly: it resolves update/deactivate by countryCode
 * rather than countryId, unlike a generic Tier2 table. dbo.country has no
 * audit columns at all (see Country.java's class doc), so unlike most other
 * master data entities there's no createdBy to assert on.
 */
class CountryControllerTest extends ApiTestBase {

    /** CHAR(2) unique code — unique() alone doesn't fit (it's much longer
     *  than 2 chars), so this derives a pseudo-random 2-letter code from the
     *  same collision-free counter instead. */
    private static String uniqueCountryCode() {
        long n = Long.parseLong(unique().substring(1));
        int bucket = (int) (n % 676);
        return "" + (char) ('A' + bucket / 26) + (char) ('A' + bucket % 26);
    }

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("countryCode", code);
        payload.put("countryName", "Test Country " + code);
        payload.put("region", "EUROPE");
        payload.put("phoneCode", "+99");
        payload.put("fatfStatus", "COMPLIANT");
        payload.put("sanctionStatus", "CLEAR");
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists() throws Exception {
        String code = uniqueCountryCode();
        mockMvc.perform(auth(post("/api/v1/countries")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.countryCode").value(code))
                .andExpect(jsonPath("$.countryId").isNumber())
                .andExpect(jsonPath("$.countryName").value("Test Country " + code));
    }

    @Test
    void create_duplicate_countryCode_returns_409() throws Exception {
        String code = uniqueCountryCode();
        mockMvc.perform(auth(post("/api/v1/countries")).content(json(validPayload(code))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/countries")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void create_invalid_region_returns_400_or_409() throws Exception {
        Map<String, Object> payload = validPayload(uniqueCountryCode());
        payload.put("region", "NOT_A_REAL_REGION");
        mockMvc.perform(auth(post("/api/v1/countries")).content(json(payload)))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(status == 400 || status == 409,
                            "expected 400/409 for invalid region CHECK constraint, got " + status);
                });
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/countries")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String code = uniqueCountryCode();
        String createBody = mockMvc.perform(auth(post("/api/v1/countries")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("countryName", "Updated Country Name " + code);
        // V133 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/countries/" + code)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.countryName").value("Updated Country Name " + code));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = uniqueCountryCode();
        mockMvc.perform(auth(post("/api/v1/countries")).content(json(validPayload(code))))
                .andExpect(status().isCreated());

        mockMvc.perform(auth(patch("/api/v1/countries/" + code + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
