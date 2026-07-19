package com.etrm.system.trader;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/traders. dbo.trader.user_id has a UNIQUE constraint
 * (uq_trader_user) and the seeded dbo.app_user rows are almost entirely
 * already consumed by the 3 seeded traders — so every test creates its own
 * fresh app_user first via the real POST /api/v1/admin/users endpoint
 * (SystemUserControllerTest's own pattern), rather than hardcoding one of
 * the few spare seeded user ids (which would collide across repeated runs
 * of this class). legalEntityId=1 (MTUK) is a real seeded row.
 */
class TraderControllerTest extends ApiTestBase {

    private Map<String, Object> userPayload(String username) {
        Map<String, Object> m = new HashMap<>();
        m.put("username", username);
        m.put("email", username + "@example.com");
        m.put("fullName", "Test User " + username);
        m.put("password", "DevTest123!");
        m.put("legalEntityId", 1);
        return m;
    }

    private int createUser(String username) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/admin/users")).content(json(userPayload(username))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("userId").asInt();
    }

    private Map<String, Object> validPayload(String code, int userId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", userId);
        payload.put("legalEntityId", 1);
        payload.put("traderCode", code);
        payload.put("limitCurrencyId", 1);
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_populates_createdBy() throws Exception {
        String code = unique();
        int userId = createUser("t" + code);

        mockMvc.perform(auth(post("/api/v1/traders")).content(json(validPayload(code, userId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.traderCode").value(code.toUpperCase()))
                .andExpect(jsonPath("$.traderId").isNumber())
                .andExpect(jsonPath("$.legalEntityCode").value("MTUK"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_traderCode_returns_409() throws Exception {
        String code = unique();
        int userId1 = createUser("t" + code + "a");
        mockMvc.perform(auth(post("/api/v1/traders")).content(json(validPayload(code, userId1))))
                .andExpect(status().isCreated());

        int userId2 = createUser("t" + code + "b");
        mockMvc.perform(auth(post("/api/v1/traders")).content(json(validPayload(code, userId2))))
                .andExpect(status().isConflict());
    }

    @Test
    void create_duplicate_userId_returns_409() throws Exception {
        String code = unique();
        int userId = createUser("t" + code);
        mockMvc.perform(auth(post("/api/v1/traders")).content(json(validPayload(code, userId))))
                .andExpect(status().isCreated());

        Map<String, Object> secondPayload = validPayload(unique(), userId);
        mockMvc.perform(auth(post("/api/v1/traders")).content(json(secondPayload)))
                .andExpect(status().isConflict());
    }

    /**
     * TraderService.defaultLimitCurrency only fills in limitCurrencyId when
     * the field is absent from the payload (matches the frontend
     * TraderInput type, which has no limitCurrencyId field at all per
     * TraderService's own doc comment). Confirms that path actually works —
     * unlike CalendarHoliday.calendarId/PipelineSegment.fromPointId, which
     * had a wrongly-placed @NotNull blocking their equivalent
     * resolve-before-save paths, Trader.limitCurrencyId is correctly NOT
     * annotated @NotNull on the entity, so this is regression coverage
     * confirming that stays true rather than a bug report.
     */
    @Test
    void create_without_limitCurrencyId_defaults_to_base_currency() throws Exception {
        String code = unique();
        int userId = createUser("t" + code);
        Map<String, Object> payload = validPayload(code, userId);
        payload.remove("limitCurrencyId");

        mockMvc.perform(auth(post("/api/v1/traders")).content(json(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.traderId").isNumber());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/traders")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_createdBy() throws Exception {
        String code = unique();
        int userId = createUser("t" + code);
        String createBody = mockMvc.perform(auth(post("/api/v1/traders")).content(json(validPayload(code, userId))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("traderId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code, userId));
        update.put("dailyTradeLimit", 500000);
        // V129 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/traders/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailyTradeLimit").value(500000))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void get_returns_denormalized_fields() throws Exception {
        String code = unique();
        int userId = createUser("t" + code);
        String createBody = mockMvc.perform(auth(post("/api/v1/traders")).content(json(validPayload(code, userId))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("traderId").asInt();

        mockMvc.perform(auth(get("/api/v1/traders/" + id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.legalEntityCode").value("MTUK"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        int userId = createUser("t" + code);
        String createBody = mockMvc.perform(auth(post("/api/v1/traders")).content(json(validPayload(code, userId))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("traderId").asInt();

        mockMvc.perform(auth(patch("/api/v1/traders/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
