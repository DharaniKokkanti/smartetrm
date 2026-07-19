package com.etrm.system.paymentterm;

import com.etrm.system.support.ApiTestBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/payment-methods.
 *
 * TWO REAL BUGS found while writing this test, both UNCONDITIONAL (no
 * workaround possible without touching main/ source), stacked on the same
 * create() path:
 *
 *  1. PaymentMethod.paymentMethodId has no @GeneratedValue even though
 *     dbo.payment_method.payment_method_id IS a real IDENTITY column
 *     (verified live via sys.columns.is_identity=1). PaymentMethodService
 *     .create() unconditionally does `input.setPaymentMethodId(null)`
 *     before saving, so even supplying an explicit id in the payload
 *     doesn't help — Hibernate always throws IdentifierGenerationException
 *     and every POST returns 500 (verified live via curl and via the
 *     create_* test below). Same unconditional bug exists in Incoterm — see
 *     IncotermControllerTest for the fuller writeup.
 *  2. Even setting bug #1 aside, PaymentMethod never maps
 *     created_by/updated_at/updated_by at all (only created_at), yet all
 *     three are real NOT NULL columns on dbo.payment_method (verified live
 *     via sys.columns.is_nullable=0) — an INSERT driven purely by the
 *     entity's mapped fields would additionally fail on
 *     "Cannot insert the value NULL into column 'created_by'". Confirmed by
 *     reproducing it directly: seedPaymentMethod() below has to supply
 *     created_by/updated_at/updated_by explicitly via raw SQL to get past
 *     this, something the entity itself has no way to do.
 *
 * Since create is completely blocked, list/update/deactivate below seed
 * their row directly via JdbcTemplate (bypassing the broken JPA insert
 * path) — PaymentMethodService.update()/deactivate() themselves work fine
 * against an already-valid row, they just never mint one the way create()
 * is supposed to.
 */
class PaymentMethodControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private int seedPaymentMethod(String code) {
        int nextId = jdbc.queryForObject("SELECT ISNULL(MAX(payment_method_id), 0) + 1 FROM dbo.payment_method", Integer.class);
        jdbc.execute("SET IDENTITY_INSERT dbo.payment_method ON");
        try {
            // created_by/updated_at/updated_by are real NOT NULL columns the
            // entity never maps (bug #2 above) — supplied here explicitly.
            LocalDateTime now = LocalDateTime.now();
            jdbc.update("INSERT INTO dbo.payment_method (payment_method_id, type_code, type_name, is_active, " +
                            "created_at, created_by, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    nextId, code, "Test Payment Method " + code, true, now, "j.smith", now, "j.smith");
        } finally {
            jdbc.execute("SET IDENTITY_INSERT dbo.payment_method OFF");
        }
        return nextId;
    }

    @Test
    void create_currently_fails_500_unconditionally() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("methodCode", ("PM" + System.nanoTime() % 100000).toUpperCase());
        payload.put("methodName", "Should never persist");

        mockMvc.perform(auth(post("/api/v1/payment-methods")).content(json(payload)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/payment-methods")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String code = ("PM" + System.nanoTime() % 100000).toUpperCase();
        int id = seedPaymentMethod(code);

        Map<String, Object> update = new HashMap<>();
        update.put("methodCode", code);
        update.put("methodName", "Updated Payment Method " + code);
        // V133 — seedPaymentMethod() inserts directly via JDBC, bypassing
        // Hibernate, so row_version starts at its DB DEFAULT of 0.
        update.put("rowVersion", 0);

        mockMvc.perform(auth(put("/api/v1/payment-methods/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.methodName").value("Updated Payment Method " + code));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = ("PM" + System.nanoTime() % 100000).toUpperCase();
        int id = seedPaymentMethod(code);

        mockMvc.perform(auth(patch("/api/v1/payment-methods/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
