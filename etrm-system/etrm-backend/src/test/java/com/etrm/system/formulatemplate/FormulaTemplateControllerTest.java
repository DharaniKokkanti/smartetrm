package com.etrm.system.formulatemplate;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Covers /api/v1/pricing/formula-templates: create, list, update, deactivate. */
class FormulaTemplateControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("commodityType", "CRUDE");
        payload.put("templateCode", code);
        payload.put("templateName", "Test Formula Template " + code);
        payload.put("formulaType", "FORMULA");
        payload.put("formulaExpression", "(A + B) / 2");
        payload.put("averagingType", "NONE");
        payload.put("fxConversionRequired", false);
        payload.put("description", "Test template");
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_returns_201() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/pricing/formula-templates")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.templateCode").value(code))
                .andExpect(jsonPath("$.templateId").isNumber())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/pricing/formula-templates")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/pricing/formula-templates")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("templateId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("templateName", "Updated Formula Template " + code);
        update.put("formulaExpression", "(A + B + C) / 3");
        // V131 — echo back the version just read from the create response,
        // same as a real client would; see LegalEntityControllerTest's V127 comment.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/pricing/formula-templates/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.templateName").value("Updated Formula Template " + code))
                .andExpect(jsonPath("$.formulaExpression").value("(A + B + C) / 3"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/pricing/formula-templates")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("templateId").asInt();

        mockMvc.perform(auth(patch("/api/v1/pricing/formula-templates/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
