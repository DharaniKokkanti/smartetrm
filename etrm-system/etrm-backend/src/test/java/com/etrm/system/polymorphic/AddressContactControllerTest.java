package com.etrm.system.polymorphic;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/addresses, /contacts, /entity-addresses, /entity-contacts —
 * the four polymorphic pool + link tables whose Integer/Long PK-type
 * mismatches (address_id, contact_id, entity_address_id, entity_contact_id
 * all INT, not BIGINT) were fixed this session.
 */
class AddressContactControllerTest extends ApiTestBase {

    // ── Address pool ────────────────────────────────────────────────────────

    private Map<String, Object> validAddress() {
        Map<String, Object> m = new HashMap<>();
        m.put("addressType", 1);
        m.put("addressLine1", "1 Test St");
        m.put("city", "London");
        m.put("countryId", 1);
        m.put("isActive", true);
        return m;
    }

    @Test
    void address_create_then_update_cycle() throws Exception {
        String createBody = mockMvc.perform(auth(post("/api/v1/addresses")).content(json(validAddress())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("addressId").asInt();

        mockMvc.perform(auth(get("/api/v1/addresses")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        Map<String, Object> update = new HashMap<>(validAddress());
        update.put("city", "Manchester");
        // V133 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());
        mockMvc.perform(auth(put("/api/v1/addresses/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.city").value("Manchester"))
                .andExpect(jsonPath("$.addressId").value(id));
    }

    // ── Contact pool ────────────────────────────────────────────────────────

    private Map<String, Object> validContact() {
        Map<String, Object> m = new HashMap<>();
        m.put("firstName", "Jane");
        m.put("lastName", "Doe");
        m.put("contactRole", 1);
        m.put("isActive", true);
        return m;
    }

    @Test
    void contact_create_then_update_cycle() throws Exception {
        String createBody = mockMvc.perform(auth(post("/api/v1/contacts")).content(json(validContact())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("contactId").asInt();

        Map<String, Object> update = new HashMap<>(validContact());
        update.put("lastName", "Smith");
        // V133 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());
        mockMvc.perform(auth(put("/api/v1/contacts/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastName").value("Smith"));
    }

    // ── Entity-address links ────────────────────────────────────────────────

    @Test
    void entityAddress_create_list_and_deactivate_cycle() throws Exception {
        String addrBody = mockMvc.perform(auth(post("/api/v1/addresses")).content(json(validAddress())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int addressId = objectMapper.readTree(addrBody).get("addressId").asInt();

        Map<String, Object> link = new HashMap<>();
        link.put("entityType", "COUNTERPARTY");
        link.put("entityId", 1);
        link.put("address", Map.of("addressId", addressId));
        link.put("isPrimary", true);
        link.put("isActive", true);

        String linkBody = mockMvc.perform(auth(post("/api/v1/entity-addresses")).content(json(link)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int linkId = objectMapper.readTree(linkBody).get("entityAddressId").asInt();

        mockMvc.perform(auth(get("/api/v1/entity-addresses").param("entityType", "COUNTERPARTY").param("entityId", "1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(auth(patch("/api/v1/entity-addresses/" + linkId + "/deactivate")))
                .andExpect(status().isNoContent());
    }

    // ── Entity-contact links ────────────────────────────────────────────────

    @Test
    void entityContact_create_list_and_deactivate_cycle() throws Exception {
        String contactBody = mockMvc.perform(auth(post("/api/v1/contacts")).content(json(validContact())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int contactId = objectMapper.readTree(contactBody).get("contactId").asInt();

        Map<String, Object> link = new HashMap<>();
        link.put("entityType", "COUNTERPARTY");
        link.put("entityId", 1);
        link.put("contact", Map.of("contactId", contactId));
        link.put("isPrimary", true);
        link.put("isActive", true);

        String linkBody = mockMvc.perform(auth(post("/api/v1/entity-contacts")).content(json(link)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int linkId = objectMapper.readTree(linkBody).get("entityContactId").asInt();

        mockMvc.perform(auth(get("/api/v1/entity-contacts").param("entityType", "COUNTERPARTY").param("entityId", "1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(auth(patch("/api/v1/entity-contacts/" + linkId + "/deactivate")))
                .andExpect(status().isNoContent());
    }

    @Test
    void update_nonexistent_address_returns_404() throws Exception {
        mockMvc.perform(auth(put("/api/v1/addresses/999999999")).content(json(validAddress())))
                .andExpect(status().isNotFound());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/addresses"))
                .andExpect(status().isForbidden());
    }
}
