package com.etrm.system.incoterm;

import com.etrm.system.support.ApiTestBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/incoterms-ref.
 *
 * create() previously threw IdentifierGenerationException unconditionally —
 * Incoterm.incotermId had no @GeneratedValue even though dbo.incoterm.
 * incoterm_id IS a real IDENTITY column, and IncotermService.create()
 * unconditionally nulled out any id the caller sent. Fixed by adding
 * @GeneratedValue(strategy = GenerationType.IDENTITY). Same class of bug
 * existed in PaymentMethod (see PaymentMethodControllerTest) — fixed
 * identically. While fixing it, also found created_by/updated_at/updated_by
 * were never mapped on the entity at all — every row silently fell back to
 * the DB's own 'SYSTEM' default regardless of who actually created it
 * (confirmed live via curl before the fix). Added @CreatedBy/@CreatedDate/
 * @LastModifiedBy/@LastModifiedDate, matching Period.java's precedent.
 */
class IncotermControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private int seedIncoterm(String code) {
        int nextId = jdbc.queryForObject("SELECT ISNULL(MAX(incoterm_id), 0) + 1 FROM dbo.incoterm", Integer.class);
        jdbc.execute("SET IDENTITY_INSERT dbo.incoterm ON");
        try {
            // transport_mode CHECK constraint only allows SEA_INLAND_WATERWAY/ANY (verified live).
            jdbc.update("INSERT INTO dbo.incoterm (incoterm_id, code, name, transport_mode, risk_transfer, version_year, is_active) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    nextId, code, "Test Incoterm " + code, "ANY", "Port of loading", 2020, true);
        } finally {
            jdbc.execute("SET IDENTITY_INSERT dbo.incoterm OFF");
        }
        return nextId;
    }

    @Test
    void create_persists_and_populates_createdBy() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("incotermCode", ("IC" + System.nanoTime() % 100000).toUpperCase());
        payload.put("incotermName", "New Incoterm");
        payload.put("transportMode", "ANY");
        payload.put("riskTransferPoint", "Port of loading");
        payload.put("versionYear", 2020);

        mockMvc.perform(auth(post("/api/v1/incoterms-ref")).content(json(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.incotermId").isNumber())
                .andExpect(jsonPath("$.createdBy").value("j.smith"))
                .andExpect(jsonPath("$.updatedBy").value("j.smith"));
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/incoterms-ref")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String code = ("IC" + System.nanoTime() % 100000).toUpperCase();
        int id = seedIncoterm(code);

        Map<String, Object> update = new HashMap<>();
        update.put("incotermCode", code);
        update.put("incotermName", "Updated Incoterm " + code);
        update.put("transportMode", "ANY");
        update.put("riskTransferPoint", "Port of loading");
        update.put("versionYear", 2020);
        // V133 — seedIncoterm() inserts directly via JDBC, bypassing Hibernate,
        // so row_version starts at its DB DEFAULT of 0.
        update.put("rowVersion", 0);

        mockMvc.perform(auth(put("/api/v1/incoterms-ref/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.incotermName").value("Updated Incoterm " + code));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = ("IC" + System.nanoTime() % 100000).toUpperCase();
        int id = seedIncoterm(code);

        mockMvc.perform(auth(patch("/api/v1/incoterms-ref/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
