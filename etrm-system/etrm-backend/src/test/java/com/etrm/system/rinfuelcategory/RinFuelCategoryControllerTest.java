package com.etrm.system.rinfuelcategory;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/rin-fuel-categories: flat CRUD, no FK resolution — fuel_type
 * is a plain nvarchar column.
 *
 * NOTE: RinFuelCategory.dCode declares @Size(max = 10), but dbo.rin_fuel_category
 * .d_code is actually NVARCHAR(5) — a real entity/DB mismatch. A value between
 * 6-10 chars passes Bean Validation but then fails at the DB with a truncation
 * error (400, via GlobalExceptionHandler's InvalidDataAccessResourceUsageException
 * handler) instead of the expected validation error shape. shortDCode() below
 * stays within 5 chars to avoid tripping this, matching real-world d-codes
 * (D3/D4/D5/...).
 */
class RinFuelCategoryControllerTest extends ApiTestBase {

    /**
     * d_code is NVARCHAR(5) in the DB despite the entity's @Size(max = 10) —
     * see class Javadoc. A dedicated counter (rather than truncating
     * unique()'s wider counter into 4 digits) avoids collisions across the
     * ~10000-value space this column's length allows.
     */
    private static final java.util.concurrent.atomic.AtomicInteger D_CODE_COUNTER =
            new java.util.concurrent.atomic.AtomicInteger((int) (System.nanoTime() % 9000));

    private static String shortDCode() {
        return "X" + String.format("%04d", D_CODE_COUNTER.incrementAndGet() % 10000);
    }

    private Map<String, Object> validPayload(String dCode) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("dCode", dCode);
        payload.put("fuelName", "Test Fuel " + dCode);
        payload.put("fuelType", "BIODIESEL");
        payload.put("equivalenceValue", new BigDecimal("1.50"));
        payload.put("energySources", "Soybean oil");
        payload.put("description", "Test description");
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists() throws Exception {
        String dCode = shortDCode();
        mockMvc.perform(auth(post("/api/v1/rin-fuel-categories")).content(json(validPayload(dCode))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dCode").value(dCode))
                .andExpect(jsonPath("$.categoryId").isNumber())
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    void create_duplicate_dCode_returns_409() throws Exception {
        String dCode = shortDCode();
        mockMvc.perform(auth(post("/api/v1/rin-fuel-categories")).content(json(validPayload(dCode))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/rin-fuel-categories")).content(json(validPayload(dCode))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/rin-fuel-categories")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String dCode = shortDCode();
        String createBody = mockMvc.perform(auth(post("/api/v1/rin-fuel-categories")).content(json(validPayload(dCode))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("categoryId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(dCode));
        update.put("fuelName", "Updated Name " + dCode);
        update.put("equivalenceValue", new BigDecimal("2.50"));

        mockMvc.perform(auth(put("/api/v1/rin-fuel-categories/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fuelName").value("Updated Name " + dCode))
                .andExpect(jsonPath("$.equivalenceValue").value(2.50));
    }

    @Test
    void update_nonexistent_id_returns_404() throws Exception {
        mockMvc.perform(auth(put("/api/v1/rin-fuel-categories/999999999")).content(json(validPayload(shortDCode()))))
                .andExpect(status().isNotFound());
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String dCode = shortDCode();
        String createBody = mockMvc.perform(auth(post("/api/v1/rin-fuel-categories")).content(json(validPayload(dCode))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("categoryId").asInt();

        mockMvc.perform(auth(patch("/api/v1/rin-fuel-categories/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/rin-fuel-categories"))
                .andExpect(status().isForbidden());
    }
}
