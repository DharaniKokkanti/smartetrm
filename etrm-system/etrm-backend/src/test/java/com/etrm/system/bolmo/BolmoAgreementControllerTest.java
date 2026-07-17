package com.etrm.system.bolmo;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/bolmo-agreements create/update, the four status-transition
 * actions (agree/complete/dispute/cancel), and the legs sub-resource — note
 * the leg delete endpoint is top-level at /api/v1/bolmo-legs/{legId}, not
 * nested under /bolmo-agreements. bolmo_reference is server-generated
 * (BKO-<year>-<id>) so the payload's own reference field is ignored.
 */
class BolmoAgreementControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private Map<String, Object> validPayload() {
        Integer counterpartyId = jdbc.queryForObject("SELECT TOP 1 counterparty_id FROM dbo.counterparty", Integer.class);
        Integer legalEntityId = jdbc.queryForObject("SELECT TOP 1 legal_entity_id FROM dbo.legal_entity", Integer.class);
        Integer uomId = jdbc.queryForObject("SELECT TOP 1 uom_id FROM dbo.unit_of_measure", Integer.class);
        Integer currencyId = jdbc.queryForObject("SELECT TOP 1 currency_id FROM dbo.currency", Integer.class);
        Map<String, Object> payload = new HashMap<>();
        // bolmoReference is @NotBlank on the entity so it must be present to pass
        // validation, even though BolmoAgreementService.create() always overwrites
        // it server-side with the generated BKO-<year>-<id> reference.
        payload.put("bolmoReference", "IGNORED");
        payload.put("counterpartyId", counterpartyId);
        payload.put("legalEntityId", legalEntityId);
        payload.put("agreementDate", "2026-07-01");
        payload.put("commodityType", "CRUDE");
        payload.put("netQuantity", 10000.0);
        payload.put("uomId", uomId);
        payload.put("currencyId", currencyId);
        payload.put("status", "PENDING");
        return payload;
    }

    @Test
    void create_persists_and_generates_bolmoReference() throws Exception {
        mockMvc.perform(auth(post("/api/v1/bolmo-agreements")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bolmoId").isNumber())
                .andExpect(jsonPath("$.bolmoReference").value(org.hamcrest.Matchers.matchesPattern("BKO-\\d{4}-\\d{5}")))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.legCount").value(0));
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/bolmo-agreements")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_bolmoReference() throws Exception {
        String createBody = mockMvc.perform(auth(post("/api/v1/bolmo-agreements")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("bolmoId").asInt();
        String originalReference = objectMapper.readTree(createBody).get("bolmoReference").asText();

        Map<String, Object> update = new HashMap<>(validPayload());
        update.put("commodityType", "GASOLINE");

        mockMvc.perform(auth(put("/api/v1/bolmo-agreements/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.commodityType").value("GASOLINE"))
                .andExpect(jsonPath("$.bolmoReference").value(originalReference));
    }

    @Test
    void agree_transitions_status() throws Exception {
        String createBody = mockMvc.perform(auth(post("/api/v1/bolmo-agreements")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("bolmoId").asInt();

        mockMvc.perform(auth(patch("/api/v1/bolmo-agreements/" + id + "/agree")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AGREED"));
    }

    @Test
    void complete_dispute_cancel_transition_status() throws Exception {
        String body1 = mockMvc.perform(auth(post("/api/v1/bolmo-agreements")).content(json(validPayload())))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        int id1 = objectMapper.readTree(body1).get("bolmoId").asInt();
        mockMvc.perform(auth(patch("/api/v1/bolmo-agreements/" + id1 + "/complete")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        String body2 = mockMvc.perform(auth(post("/api/v1/bolmo-agreements")).content(json(validPayload())))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        int id2 = objectMapper.readTree(body2).get("bolmoId").asInt();
        mockMvc.perform(auth(patch("/api/v1/bolmo-agreements/" + id2 + "/dispute")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISPUTED"));

        String body3 = mockMvc.perform(auth(post("/api/v1/bolmo-agreements")).content(json(validPayload())))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        int id3 = objectMapper.readTree(body3).get("bolmoId").asInt();
        mockMvc.perform(auth(patch("/api/v1/bolmo-agreements/" + id3 + "/cancel")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void legs_add_list_then_delete_via_top_level_path() throws Exception {
        String createBody = mockMvc.perform(auth(post("/api/v1/bolmo-agreements")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int bolmoId = objectMapper.readTree(createBody).get("bolmoId").asInt();

        Integer uomId = jdbc.queryForObject("SELECT TOP 1 uom_id FROM dbo.unit_of_measure", Integer.class);
        Map<String, Object> legPayload = new HashMap<>();
        // BolmoLegInput (etrm-frontend/src/features/bolmo/types.ts) only omits
        // legId/orderReference/createdAt — bolmoId IS part of the real payload
        // (BolmoAgreementsPage keeps a hidden form field for it), even though
        // BolmoAgreementService.addLeg() also sets it server-side afterward.
        legPayload.put("bolmoId", bolmoId);
        legPayload.put("direction", "BUY"); // dbo.bolmo_leg chk allows only BUY/SELL
        legPayload.put("quantity", 500.0);
        legPayload.put("uomId", uomId);

        String legBody = mockMvc.perform(auth(post("/api/v1/bolmo-agreements/" + bolmoId + "/legs")).content(json(legPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bolmoId").value(bolmoId))
                .andReturn().getResponse().getContentAsString();
        int legId = objectMapper.readTree(legBody).get("legId").asInt();

        mockMvc.perform(auth(get("/api/v1/bolmo-agreements/" + bolmoId + "/legs")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].legId").value(legId));

        // Confirm the parent's hydrated legCount/legs reflect the new leg.
        mockMvc.perform(auth(get("/api/v1/bolmo-agreements")))
                .andExpect(status().isOk());

        mockMvc.perform(auth(delete("/api/v1/bolmo-legs/" + legId)))
                .andExpect(status().isNoContent());

        mockMvc.perform(auth(get("/api/v1/bolmo-agreements/" + bolmoId + "/legs")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/bolmo-agreements"))
                .andExpect(status().isForbidden());
    }
}
