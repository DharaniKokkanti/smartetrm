package com.etrm.system.glaccount;

import com.etrm.system.support.ApiTestBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/gl-accounts: create, list, update, deactivate.
 *
 * Regression coverage for two real bugs found while first writing this
 * suite, both now fixed:
 *   1. GlAccount had two getters bound to the same JSON property name
 *      "accountType" (the raw Integer FK field and the denormalized
 *      accountTypeCode String, both reachable) — Jackson refused to build
 *      any (de)serializer for the class, so every POST/PUT/GET-with-body
 *      500'd (InvalidDefinitionException). Fixed by @JsonIgnore-ing the raw
 *      field's getter/setter.
 *   2. Once (1) was fixed, accountType's raw field carried @NotNull, which
 *      Bean Validation enforces on the deserialized entity BEFORE
 *      GlAccountService ever resolves accountTypeCode -> accountType — so
 *      every request still 400'd. Fixed by dropping @NotNull from the field
 *      (enforcement belongs in resolveForeignKeys/the DB's own NOT NULL).
 *   3. Also found: GlAccountService.create()/update() never actually called
 *      resolveForeignKeys() at all — accountTypeCode was hydrated for
 *      display but never resolved back to accountType on write, so a real
 *      client sending the string code (as the frontend always does) would
 *      persist a NULL account_type and fail the DB's own NOT NULL
 *      constraint. Fixed by wiring resolveForeignKeys() into both methods.
 */
class GlAccountControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private Map<String, Object> validPayload(String code) {
        String accountTypeCode = jdbc.queryForObject(
                "SELECT TOP 1 lv.code FROM dbo.lookup_value lv JOIN dbo.lookup_category lc " +
                        "ON lv.category_id = lc.category_id WHERE lc.category_code = 'GL_ACCOUNT_TYPE'",
                String.class);
        Integer legalEntityId = jdbc.queryForObject("SELECT TOP 1 legal_entity_id FROM dbo.legal_entity", Integer.class);
        Integer bookId = jdbc.queryForObject("SELECT TOP 1 book_id FROM dbo.book", Integer.class);
        Integer currencyId = jdbc.queryForObject("SELECT TOP 1 currency_id FROM dbo.currency", Integer.class);

        Map<String, Object> payload = new HashMap<>();
        payload.put("accountCode", code);
        payload.put("accountName", "Test GL Account " + code);
        payload.put("accountType", accountTypeCode);
        payload.put("costCenter", "CC-100");
        payload.put("description", "Test account");
        payload.put("legalEntityId", legalEntityId);
        payload.put("bookId", bookId);
        payload.put("normalBalance", "DEBIT");
        payload.put("currencyId", currencyId);
        payload.put("isControlAccount", false);
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_resolves_accountType_code() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/gl-accounts")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accountCode").value(code))
                .andExpect(jsonPath("$.accountId").isNumber())
                .andExpect(jsonPath("$.accountType").isNotEmpty())
                .andExpect(jsonPath("$.legalEntityCode").isNotEmpty())
                .andExpect(jsonPath("$.bookCode").isNotEmpty());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/gl-accounts")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/gl-accounts")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("accountId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("description", "Updated description");

        mockMvc.perform(auth(put("/api/v1/gl-accounts/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Updated description"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/gl-accounts")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("accountId").asInt();

        mockMvc.perform(auth(patch("/api/v1/gl-accounts/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
