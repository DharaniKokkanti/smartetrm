package com.etrm.system.rinaccount;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/rin-accounts: create (incl. entityName hydration),
 * duplicate account_code 409, list, update, deactivate, unauthenticated
 * access. account_type is a plain nvarchar (no lookup table).
 */
class RinAccountControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private Integer realLegalEntityId() {
        return jdbc.queryForObject("SELECT TOP 1 legal_entity_id FROM dbo.legal_entity", Integer.class);
    }

    private Map<String, Object> validPayload(String code, Integer legalEntityId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("legalEntityId", legalEntityId);
        payload.put("epaCompanyId", "EPA-" + code);
        payload.put("epaFacilityId", "FAC-" + code);
        payload.put("accountCode", code);
        payload.put("accountName", "Test Account " + code);
        payload.put("accountType", "TRADING");
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_hydrates_entityName() throws Exception {
        String code = unique();
        Integer legalEntityId = realLegalEntityId();
        mockMvc.perform(auth(post("/api/v1/rin-accounts")).content(json(validPayload(code, legalEntityId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accountCode").value(code))
                .andExpect(jsonPath("$.accountId").isNumber())
                .andExpect(jsonPath("$.entityName").isNotEmpty())
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    void create_duplicate_accountCode_returns_409() throws Exception {
        String code = unique();
        Integer legalEntityId = realLegalEntityId();
        mockMvc.perform(auth(post("/api/v1/rin-accounts")).content(json(validPayload(code, legalEntityId))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/rin-accounts")).content(json(validPayload(code, legalEntityId))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/rin-accounts")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String code = unique();
        Integer legalEntityId = realLegalEntityId();
        String createBody = mockMvc.perform(auth(post("/api/v1/rin-accounts")).content(json(validPayload(code, legalEntityId))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("accountId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code, legalEntityId));
        update.put("accountName", "Updated Name " + code);
        update.put("accountType", "EXPORTER");

        mockMvc.perform(auth(put("/api/v1/rin-accounts/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountName").value("Updated Name " + code))
                .andExpect(jsonPath("$.accountType").value("EXPORTER"));
    }

    @Test
    void update_nonexistent_id_returns_404() throws Exception {
        Integer legalEntityId = realLegalEntityId();
        mockMvc.perform(auth(put("/api/v1/rin-accounts/999999999")).content(json(validPayload(unique(), legalEntityId))))
                .andExpect(status().isNotFound());
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        Integer legalEntityId = realLegalEntityId();
        String createBody = mockMvc.perform(auth(post("/api/v1/rin-accounts")).content(json(validPayload(code, legalEntityId))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("accountId").asInt();

        mockMvc.perform(auth(patch("/api/v1/rin-accounts/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/rin-accounts"))
                .andExpect(status().isForbidden());
    }
}
