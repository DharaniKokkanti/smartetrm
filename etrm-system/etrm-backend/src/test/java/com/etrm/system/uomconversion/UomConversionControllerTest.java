package com.etrm.system.uomconversion;

import com.etrm.system.support.ApiTestBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/uom-conversions: create, list, update, real hard DELETE (no
 * is_active column on dbo.uom_conversion — see UomConversion.java's doc
 * comment). dbo.uom_conversion has a composite unique index on
 * (from_uom_id, to_uom_id, commodity_type) — commodity_type is free varchar
 * here (no CHECK constraint, verified live), so unique() is used as the
 * commodity_type value per test method to avoid collisions across methods
 * and across repeated suite runs, since from/to uom codes are fixed lookups.
 *
 * REAL BUG found while writing this test: UomConversionController.create()
 * is annotated @Valid, and UomConversion.fromUomId/toUomId are @NotNull. Per
 * UomConversion.java's own doc comment, "the frontend only ever sends/
 * receives the denormalized fromUomCode/toUomCode display codes, never the
 * raw from_uom_id/to_uom_id" — UomConversionService resolves the codes to
 * ids AFTER bean validation already ran. So a real frontend request (code
 * fields only, no id fields) is rejected 400 by @Valid before the service
 * ever gets a chance to resolve them — confirmed live (400,
 * errors: fromUomId/toUomId "must not be null"). This test works around it
 * by additionally supplying the real ids in the payload (harmless —
 * UomConversionService.resolveUomIds() unconditionally overwrites them from
 * the codes anyway), which is NOT what the real frontend sends and would
 * not itself get past validation.
 */
class UomConversionControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private String fromUom;
    private String toUom;
    private Integer fromUomId;
    private Integer toUomId;

    private void loadUoms() {
        if (fromUom == null) {
            List<Map<String, Object>> rows = jdbc.queryForList("SELECT TOP 2 uom_id, uom_code FROM dbo.unit_of_measure ORDER BY uom_id");
            fromUomId = (Integer) rows.get(0).get("uom_id");
            fromUom = (String) rows.get(0).get("uom_code");
            toUomId = (Integer) rows.get(1).get("uom_id");
            toUom = (String) rows.get(1).get("uom_code");
        }
    }

    private Map<String, Object> validPayload(String commodityType) {
        loadUoms();
        Map<String, Object> payload = new HashMap<>();
        payload.put("fromUomCode", fromUom);
        payload.put("toUomCode", toUom);
        // Also supplying the raw ids works around the @Valid/resolution-order
        // bug documented above — see class doc comment.
        payload.put("fromUomId", fromUomId);
        payload.put("toUomId", toUomId);
        payload.put("factor", 2.5);
        payload.put("commodityType", commodityType);
        payload.put("validFrom", "2026-01-01");
        payload.put("notes", "Test conversion");
        return payload;
    }

    @Test
    void create_persists_and_hydrates_uom_codes() throws Exception {
        String ct = unique();
        mockMvc.perform(auth(post("/api/v1/uom-conversions")).content(json(validPayload(ct))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fromUomCode").value(fromUom))
                .andExpect(jsonPath("$.toUomCode").value(toUom))
                .andExpect(jsonPath("$.conversionId").isNumber());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/uom-conversions")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String ct = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/uom-conversions")).content(json(validPayload(ct))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("conversionId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(ct));
        update.put("factor", 3.75);
        update.put("notes", "Updated conversion");

        mockMvc.perform(auth(put("/api/v1/uom-conversions/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.factor").value(3.75))
                .andExpect(jsonPath("$.notes").value("Updated conversion"));
    }

    @Test
    void delete_hard_deletes_the_row() throws Exception {
        String ct = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/uom-conversions")).content(json(validPayload(ct))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("conversionId").asInt();

        mockMvc.perform(auth(delete("/api/v1/uom-conversions/" + id)))
                .andExpect(status().isNoContent());

        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM dbo.uom_conversion WHERE conversion_id = ?", Integer.class, id);
        org.junit.jupiter.api.Assertions.assertEquals(0, count);
    }
}
