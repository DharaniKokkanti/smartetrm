package com.etrm.system.gtc;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/gtcs: create (which also writes the flattened dbo.gtc_version
 * "current version" row), list, update, deactivate. See Gtc.java's doc
 * comment for the gtc/gtc_version flattening. createdBy is a plain @NotBlank
 * column on Gtc (not a @CreatedBy-annotated auditing field like Period), so
 * it must be supplied explicitly in the payload.
 */
class GtcControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("gtcCode", code);
        payload.put("gtcName", "Test GTC " + code);
        payload.put("gtcType", "CRUDE");
        payload.put("version", "1");
        payload.put("effectiveDate", "2026-01-01");
        payload.put("governingLaw", "England and Wales");
        payload.put("disputeResolution", "LCIA Arbitration");
        payload.put("description", "Test GTC");
        payload.put("isActive", true);
        payload.put("createdBy", "j.smith");
        return payload;
    }

    @Test
    void create_persists_gtc_and_current_version() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/gtcs")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.gtcCode").value(code))
                .andExpect(jsonPath("$.gtcId").isNumber())
                .andExpect(jsonPath("$.version").value("1"))
                .andExpect(jsonPath("$.effectiveDate").value("2026-01-01"))
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/gtcs")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_to_gtc_and_current_version() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/gtcs")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("gtcId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("gtcName", "Updated GTC " + code);
        update.put("version", "2");
        // V129 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/gtcs/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gtcName").value("Updated GTC " + code))
                .andExpect(jsonPath("$.version").value("2"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/gtcs")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("gtcId").asInt();

        mockMvc.perform(auth(patch("/api/v1/gtcs/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
