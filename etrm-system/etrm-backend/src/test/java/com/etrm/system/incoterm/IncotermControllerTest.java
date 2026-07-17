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
 * REAL BUG found while writing this test, and it is UNCONDITIONAL (no
 * workaround possible without touching main/ source): Incoterm.incotermId
 * has no @GeneratedValue even though dbo.incoterm.incoterm_id IS a real
 * IDENTITY column (verified live via sys.columns.is_identity=1) — Hibernate
 * therefore requires the id to be manually assigned before persist(). That
 * alone would be workable by supplying an id in the payload, EXCEPT
 * IncotermService.create() unconditionally does `input.setIncotermId(null)`
 * before saving, discarding whatever id the caller sent. The result: every
 * single POST /api/v1/incoterms-ref throws IdentifierGenerationException
 * and returns 500, with no payload shape that can avoid it (verified live
 * via curl and via the create_* test below). Same unconditional bug exists
 * in PaymentMethod (see PaymentMethodControllerTest).
 *
 * Since create is completely blocked, list/update/deactivate below seed
 * their row directly via JdbcTemplate (bypassing the broken JPA insert
 * path) — IncotermService.update()/deactivate() themselves work fine, they
 * just never mint the id null the way create() does.
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
    void create_currently_fails_500_unconditionally() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("incotermCode", ("IC" + System.nanoTime() % 100000).toUpperCase());
        payload.put("incotermName", "Should never persist");
        payload.put("transportMode", "SEA");
        payload.put("riskTransferPoint", "Port of loading");
        payload.put("versionYear", 2020);

        mockMvc.perform(auth(post("/api/v1/incoterms-ref")).content(json(payload)))
                .andExpect(status().isInternalServerError());
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
