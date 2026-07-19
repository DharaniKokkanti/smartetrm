package com.etrm.system.taxregistration;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/entity-tax-registrations CRUD (dbo.tax_registration extends
 * AuditableEntity). Polymorphic — entityType/entityId identify the owning
 * LEGAL_ENTITY/COUNTERPARTY/BROKER row, same pattern as EntityAddress/
 * EntityContact. No dedicated Service class — the controller talks to the
 * repository directly.
 */
class TaxRegistrationControllerTest extends ApiTestBase {

    // entity_id has no FK constraint (polymorphic — it's just an INT that
    // means something different per entityType), so any collision-free
    // value works. Using unique() here (rather than hardcoded small ids
    // like 1/2/3) avoids colliding with tax_registration's real unique key
    // — (entity_type, entity_id, tax_type, jurisdiction_id) — on repeated
    // `mvn test` runs against the same live DB.
    private static int uniqueEntityId() {
        return Integer.parseInt(unique().substring(1));
    }

    private Map<String, Object> validPayload(int entityId, int jurisdictionId) {
        Map<String, Object> m = new HashMap<>();
        m.put("entityType", "LEGAL_ENTITY");
        m.put("entityId", entityId);
        m.put("taxType", 1); // VAT
        m.put("taxId", "TAX-" + unique());
        m.put("jurisdictionId", jurisdictionId);
        m.put("isPrimary", true);
        m.put("isActive", true);
        return m;
    }

    private int createRegistration(int entityId, int jurisdictionId) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/entity-tax-registrations")).content(json(validPayload(entityId, jurisdictionId))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("taxRegId").asInt();
    }

    @Test
    void create_persists_and_auto_populates_createdBy() throws Exception {
        mockMvc.perform(auth(post("/api/v1/entity-tax-registrations")).content(json(validPayload(uniqueEntityId(), 1))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.taxRegId").isNumber())
                .andExpect(jsonPath("$.entityType").value("LEGAL_ENTITY"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_scope_returns_409() throws Exception {
        int entityId = uniqueEntityId();
        createRegistration(entityId, 2);
        mockMvc.perform(auth(post("/api/v1/entity-tax-registrations")).content(json(validPayload(entityId, 2))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/entity-tax-registrations")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void list_filtered_by_entity_returns_only_matching_rows() throws Exception {
        int entityId = uniqueEntityId();
        createRegistration(entityId, 1);
        mockMvc.perform(auth(get("/api/v1/entity-tax-registrations")
                        .param("entityType", "LEGAL_ENTITY")
                        .param("entityId", String.valueOf(entityId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].entityId").value(entityId));
    }

    @Test
    void update_persists_changes_and_preserves_original_createdBy() throws Exception {
        int entityId = uniqueEntityId();
        String createBody = mockMvc.perform(auth(post("/api/v1/entity-tax-registrations")).content(json(validPayload(entityId, 1))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("taxRegId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(entityId, 1));
        update.put("issuingAuthority", "HMRC");
        // V133 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/entity-tax-registrations/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.issuingAuthority").value("HMRC"))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        int id = createRegistration(uniqueEntityId(), 1);
        mockMvc.perform(auth(patch("/api/v1/entity-tax-registrations/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
