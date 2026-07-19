package com.etrm.system.priceindexsource;

import com.etrm.system.support.ApiTestBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/price-index-sources (link table between dbo.price_index and
 * dbo.price_source): create, list, update, deactivate, plus the sub-resource
 * GET /api/v1/price-sources/{priceSourceId}/index-links. dbo.price_index_source
 * has a composite unique index on (price_index_id, price_source_id,
 * source_role) — each test method uses a distinct source_role from the
 * CHECK constraint's fixed set (REFERENCE/BACKUP/SETTLEMENT/PRIMARY_MTM) to
 * avoid collisions within a run, and deletes any pre-existing row for that
 * same (index, source, role) combo up front so repeated suite runs against
 * this live DB (which reuse the same TOP-1 index/source ids every time)
 * don't 409 against a prior run's leftover row.
 */
class PriceIndexSourceControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    /** Called once per test, before the first create — see class doc comment. */
    private void deleteAnyExisting(String sourceRole) {
        Integer priceIndexId = jdbc.queryForObject("SELECT TOP 1 price_index_id FROM dbo.price_index ORDER BY price_index_id", Integer.class);
        Integer priceSourceId = jdbc.queryForObject("SELECT TOP 1 price_source_id FROM dbo.price_source ORDER BY price_source_id", Integer.class);
        jdbc.update("DELETE FROM dbo.price_index_source WHERE price_index_id = ? AND price_source_id = ? AND source_role = ?",
                priceIndexId, priceSourceId, sourceRole);
    }

    private Map<String, Object> validPayload(String sourceRole) {
        Integer priceIndexId = jdbc.queryForObject("SELECT TOP 1 price_index_id FROM dbo.price_index ORDER BY price_index_id", Integer.class);
        Integer priceSourceId = jdbc.queryForObject("SELECT TOP 1 price_source_id FROM dbo.price_source ORDER BY price_source_id", Integer.class);

        Map<String, Object> payload = new HashMap<>();
        payload.put("priceIndexId", priceIndexId);
        payload.put("priceSourceId", priceSourceId);
        payload.put("sourceRole", sourceRole);
        payload.put("sourceFieldCode", "CLOSE");
        payload.put("sourceTicker", "TICK123");
        payload.put("priceMultiplier", 1.0);
        payload.put("priceOffset", 0.0);
        payload.put("calculationSequence", 1);
        payload.put("effectiveFrom", "2026-01-01");
        payload.put("isActive", true);
        payload.put("notes", "Test link");
        return payload;
    }

    @Test
    void create_persists_and_hydrates_index_and_source_codes() throws Exception {
        deleteAnyExisting("REFERENCE");
        mockMvc.perform(auth(post("/api/v1/price-index-sources")).content(json(validPayload("REFERENCE"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sourceRole").value("REFERENCE"))
                .andExpect(jsonPath("$.pisId").isNumber())
                .andExpect(jsonPath("$.priceIndexCode").isNotEmpty())
                .andExpect(jsonPath("$.sourceCode").isNotEmpty());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/price-index-sources")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void listByPriceSource_returns_only_links_for_that_source() throws Exception {
        deleteAnyExisting("BACKUP");
        String createBody = mockMvc.perform(auth(post("/api/v1/price-index-sources")).content(json(validPayload("BACKUP"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int priceSourceId = objectMapper.readTree(createBody).get("priceSourceId").asInt();

        mockMvc.perform(auth(get("/api/v1/price-sources/" + priceSourceId + "/index-links")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].priceSourceId").value(priceSourceId));
    }

    @Test
    void update_persists_changes() throws Exception {
        deleteAnyExisting("SETTLEMENT");
        String createBody = mockMvc.perform(auth(post("/api/v1/price-index-sources")).content(json(validPayload("SETTLEMENT"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("pisId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload("SETTLEMENT"));
        update.put("priceMultiplier", new BigDecimal("1.5"));
        update.put("notes", "Updated link");
        // V131 — echo back the version just read from the create response,
        // same as a real client would; see LegalEntityControllerTest's V127 comment.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/price-index-sources/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priceMultiplier").value(1.5))
                .andExpect(jsonPath("$.notes").value("Updated link"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        deleteAnyExisting("PRIMARY_MTM");
        String createBody = mockMvc.perform(auth(post("/api/v1/price-index-sources")).content(json(validPayload("PRIMARY_MTM"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("pisId").asInt();

        mockMvc.perform(auth(patch("/api/v1/price-index-sources/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
