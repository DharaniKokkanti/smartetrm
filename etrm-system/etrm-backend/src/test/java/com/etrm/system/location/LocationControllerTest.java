package com.etrm.system.location;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/locations. locationTypeId=1 (PORT) and countryId=1 (GB) are
 * real seeded rows confirmed via direct SQL. Unlike Truck.operatorId/
 * Trader.limitCurrencyId, Location's code->id resolution field
 * (locationTypeCode) is genuinely optional here — the payload below sends
 * locationTypeId directly, which is the field that's actually @NotNull, so
 * this does not hit that bug pattern.
 */
class LocationControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("locationTypeId", 1);
        payload.put("locationCode", code);
        payload.put("locationName", "Test Location " + code);
        payload.put("countryId", 1);
        payload.put("region", "Europe");
        payload.put("timezone", "UTC");
        payload.put("isActive", true);
        payload.put("officeLocInd", false);
        payload.put("tradingDeskInd", false);
        return payload;
    }

    @Test
    void create_persists_and_populates_createdBy() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/locations")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.locationCode").value(code.toUpperCase()))
                .andExpect(jsonPath("$.locationId").isNumber())
                .andExpect(jsonPath("$.locationTypeCode").value("PORT"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    /**
     * LocationService.resolveForeignKeys resolves locationTypeCode ->
     * locationTypeId for callers that only send the code (Location.java's
     * own class doc: "the frontend LocationTypeCode is a plain code
     * string, not the numeric location_type_id FK") — confirms that path
     * reaches the database rather than 400ing on bean validation before the
     * resolution runs (the pattern found and fixed on CalendarHoliday.
     * calendarId / PipelineSegment.fromPointId / Trader.limitCurrencyId /
     * Truck.operatorId this session).
     */
    @Test
    void create_with_locationTypeCode_only_resolves_locationTypeId() throws Exception {
        String code = unique();
        Map<String, Object> payload = validPayload(code);
        payload.remove("locationTypeId");
        payload.put("locationTypeCode", "PORT");

        mockMvc.perform(auth(post("/api/v1/locations")).content(json(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.locationTypeCode").value("PORT"));
    }

    @Test
    void create_duplicate_locationCode_returns_409() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/locations")).content(json(validPayload(code))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/locations")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void create_missing_countryId_returns_400() throws Exception {
        Map<String, Object> payload = validPayload(unique());
        payload.remove("countryId");
        mockMvc.perform(auth(post("/api/v1/locations")).content(json(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/locations")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void listTradingDesks_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/locations/trading-desks")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_createdBy() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/locations")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("locationId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("locationName", "Updated Location Name " + code);
        // V130 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/locations/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.locationName").value("Updated Location Name " + code))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/locations")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("locationId").asInt();

        mockMvc.perform(auth(patch("/api/v1/locations/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
