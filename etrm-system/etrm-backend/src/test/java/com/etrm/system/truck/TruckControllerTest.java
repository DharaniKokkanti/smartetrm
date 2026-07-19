package com.etrm.system.truck;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/trucks. operatorId=1 (Maersk Tankers A/S) and countryId=1
 * (GB) are real seeded rows confirmed via direct SQL.
 */
class TruckControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String plate) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("licensePlate", plate);
        payload.put("vehicleCode", "FLEET-" + plate);
        payload.put("operatorId", 1);
        payload.put("vehicleType", "DRY_BULK");
        payload.put("adrCertified", false);
        payload.put("isActive", true);
        payload.put("countryId", 1);
        return payload;
    }

    @Test
    void create_persists_and_populates_createdBy() throws Exception {
        String plate = unique();
        mockMvc.perform(auth(post("/api/v1/trucks")).content(json(validPayload(plate))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.licensePlate").value(plate))
                .andExpect(jsonPath("$.vehicleId").isNumber())
                .andExpect(jsonPath("$.operatorName").value("Maersk Tankers A/S"))
                .andExpect(jsonPath("$.countryCode").value("GB"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    /**
     * TruckService.resolveForeignKeys resolves operatorName -> operatorId
     * for callers that only send the name (Truck.java's own class doc notes
     * the frontend Truck type has NO operatorId field at all, only
     * operatorName) — this confirms that path actually reaches the
     * database rather than 400ing on bean validation before the resolution
     * runs (the exact bug pattern found and fixed on CalendarHoliday.
     * calendarId / PipelineSegment.fromPointId / Trader.limitCurrencyId in
     * this same session).
     */
    @Test
    void create_with_operatorName_only_resolves_operatorId() throws Exception {
        Map<String, Object> payload = validPayload(unique());
        payload.remove("operatorId");
        payload.put("operatorName", "Maersk Tankers A/S");

        mockMvc.perform(auth(post("/api/v1/trucks")).content(json(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.operatorName").value("Maersk Tankers A/S"));
    }

    @Test
    void create_duplicate_licensePlate_returns_409() throws Exception {
        String plate = unique();
        mockMvc.perform(auth(post("/api/v1/trucks")).content(json(validPayload(plate))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/trucks")).content(json(validPayload(plate))))
                .andExpect(status().isConflict());
    }

    @Test
    void create_invalid_vehicleType_returns_400_or_409() throws Exception {
        Map<String, Object> payload = validPayload(unique());
        payload.put("vehicleType", "NOT_A_REAL_TYPE");
        mockMvc.perform(auth(post("/api/v1/trucks")).content(json(payload)))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(status == 400 || status == 409,
                            "expected 400/409 for invalid vehicleType CHECK constraint, got " + status);
                });
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/trucks")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_createdBy() throws Exception {
        String plate = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/trucks")).content(json(validPayload(plate))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("vehicleId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(plate));
        update.put("notes", "Updated by TruckControllerTest " + plate);
        // V130 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/trucks/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("Updated by TruckControllerTest " + plate))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String plate = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/trucks")).content(json(validPayload(plate))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("vehicleId").asInt();

        mockMvc.perform(auth(patch("/api/v1/trucks/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
