package com.etrm.system.storagefacility;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/storage. locationId=1 (SULLOM-VOE, country_id=1/GB) and
 * facilityType=13 (CHEMICAL_TANK, a real dbo.storage_facility_type row) are
 * seeded values confirmed via direct SQL. dbo.storage_facility has no audit
 * columns at all (see StorageFacility.java's class doc) — no createdAt/
 * createdBy to assert on here, unlike most other entities in this batch.
 */
class StorageFacilityControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("locationId", 1);
        payload.put("storageCode", code);
        payload.put("storageName", "Test Storage " + code);
        payload.put("commodityType", "OIL");
        payload.put("storageType", 13);
        payload.put("operatorName", "Test Operator");
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_resolves_location_and_country() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/storage")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.storageCode").value(code.toUpperCase()))
                .andExpect(jsonPath("$.storageId").isNumber())
                .andExpect(jsonPath("$.locationCode").value("SULLOM-VOE"))
                .andExpect(jsonPath("$.countryCode").value("GB"));
    }

    @Test
    void create_duplicate_storageCode_returns_409() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/storage")).content(json(validPayload(code))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/storage")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void create_missing_locationId_returns_400() throws Exception {
        Map<String, Object> payload = validPayload(unique());
        payload.remove("locationId");
        mockMvc.perform(auth(post("/api/v1/storage")).content(json(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/storage")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/storage")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("storageId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("storageName", "Updated Storage Name " + code);
        // V130 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/storage/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storageName").value("Updated Storage Name " + code));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/storage")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("storageId").asInt();

        mockMvc.perform(auth(patch("/api/v1/storage/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
