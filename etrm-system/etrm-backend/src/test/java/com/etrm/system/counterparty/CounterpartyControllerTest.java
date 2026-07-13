package com.etrm.system.counterparty;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/counterparties CRUD plus its nested contacts/bank-accounts/
 * addresses sub-resources — these are exactly the tables (contact,
 * bank_account, address) whose Integer/Long PK-type mismatches were fixed
 * this session, so exercising create+update here is the real regression
 * check for that class of bug.
 */
class CounterpartyControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> m = new HashMap<>();
        m.put("cpCode", code);
        m.put("legalName", "Test Counterparty " + code);
        m.put("shortName", code + "-short");
        m.put("jurisdictionId", 1);
        m.put("cpType", 1);
        m.put("creditLimitCurrencyId", 1);
        m.put("settlementDays", 2);
        m.put("isIntercompany", false);
        m.put("parentInd", false);
        m.put("kycStatus", 1);
        return m;
    }

    private int createCounterparty(String code) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/counterparties")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("counterpartyId").asInt();
    }

    @Test
    void create_persists_and_uppercases_cpCode_and_shortName() throws Exception {
        String code = unique().toLowerCase();
        mockMvc.perform(auth(post("/api/v1/counterparties")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cpCode").value(code.toUpperCase()))
                .andExpect(jsonPath("$.shortName").value((code + "-short").toUpperCase()));
    }

    @Test
    void create_duplicate_cpCode_returns_409() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/counterparties")).content(json(validPayload(code))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/counterparties")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void get_by_id_returns_200_then_404_for_bogus_id() throws Exception {
        int id = createCounterparty(unique());
        mockMvc.perform(auth(get("/api/v1/counterparties/" + id)))
                .andExpect(status().isOk());
        mockMvc.perform(auth(get("/api/v1/counterparties/999999999")))
                .andExpect(status().isNotFound());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/counterparties")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_but_cpCode_stays_immutable() throws Exception {
        String code = unique();
        int id = createCounterparty(code);
        Map<String, Object> update = validPayload(code.toLowerCase() + "x"); // within cp_code VARCHAR(20)
        update.put("shortName", "updated-" + code);

        mockMvc.perform(auth(put("/api/v1/counterparties/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cpCode").value(code.toUpperCase()))
                .andExpect(jsonPath("$.shortName").value(("updated-" + code).toUpperCase()));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        int id = createCounterparty(unique());
        mockMvc.perform(auth(patch("/api/v1/counterparties/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
        mockMvc.perform(auth(get("/api/v1/counterparties/" + id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(false));
    }

    // ── Nested: contacts (entity_id is BIGINT on this table) ──────────────────

    @Test
    void contact_create_list_and_update_cycle() throws Exception {
        int cpId = createCounterparty(unique());

        Map<String, Object> contact = Map.of(
                "firstName", "Jane", "lastName", "Doe", "contactRole", 1, "isActive", true
        );
        String createBody = mockMvc.perform(auth(post("/api/v1/counterparties/" + cpId + "/contacts")).content(json(contact)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int contactId = objectMapper.readTree(createBody).get("contactId").asInt();

        mockMvc.perform(auth(get("/api/v1/counterparties/" + cpId + "/contacts")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].contactId").exists());

        Map<String, Object> updated = new HashMap<>(contact);
        updated.put("lastName", "Smith");
        mockMvc.perform(auth(put("/api/v1/counterparties/" + cpId + "/contacts/" + contactId)).content(json(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastName").value("Smith"));
    }

    // ── Nested: bank accounts (entity_id is INT on this table — deliberately
    // different from contact/address, per the note in CounterpartyController) ──

    @Test
    void bankAccount_create_list_and_update_cycle() throws Exception {
        int cpId = createCounterparty(unique());

        Map<String, Object> account = Map.of(
                "accountType", 1, "currencyId", 1, "bankName", "Test Bank", "accountName", "Test Account", "isPrimary", true
        );
        String createBody = mockMvc.perform(auth(post("/api/v1/counterparties/" + cpId + "/bank-accounts")).content(json(account)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int bankAccountId = objectMapper.readTree(createBody).get("bankAccountId").asInt();

        mockMvc.perform(auth(get("/api/v1/counterparties/" + cpId + "/bank-accounts")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bankAccountId").exists());

        Map<String, Object> updated = new HashMap<>(account);
        updated.put("bankName", "Updated Bank");
        mockMvc.perform(auth(put("/api/v1/counterparties/" + cpId + "/bank-accounts/" + bankAccountId)).content(json(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bankName").value("Updated Bank"));
    }

    // ── Nested: addresses (entity_id is BIGINT on this table) ──────────────────

    @Test
    void address_create_list_and_update_cycle() throws Exception {
        int cpId = createCounterparty(unique());

        Map<String, Object> address = Map.of(
                "addressType", 1, "addressLine1", "1 Test St", "city", "London", "countryId", 1, "isActive", true
        );
        String createBody = mockMvc.perform(auth(post("/api/v1/counterparties/" + cpId + "/addresses")).content(json(address)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int addressId = objectMapper.readTree(createBody).get("addressId").asInt();

        mockMvc.perform(auth(get("/api/v1/counterparties/" + cpId + "/addresses")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].addressId").exists());

        Map<String, Object> updated = new HashMap<>(address);
        updated.put("city", "Manchester");
        mockMvc.perform(auth(put("/api/v1/counterparties/" + cpId + "/addresses/" + addressId)).content(json(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.city").value("Manchester"));
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/counterparties"))
                .andExpect(status().isForbidden());
    }
}
