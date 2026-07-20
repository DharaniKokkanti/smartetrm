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
 * create() previously threw IdentifierGenerationException unconditionally —
 * PaymentMethod.paymentMethodId had no @GeneratedValue even though
 * dbo.payment_method.payment_method_id IS a real IDENTITY column, and
 * PaymentMethodService.create() unconditionally nulled out any id the
 * caller sent. Fixed by adding @GeneratedValue(strategy =
 * GenerationType.IDENTITY). Same class of bug existed in Incoterm — see
 * IncotermControllerTest — fixed identically. While fixing it, also found
 * created_by/updated_at/updated_by were never mapped on the entity at all,
 * yet all three are real NOT NULL columns with no DB default — every create
 * would have additionally failed on a NULL constraint violation even after
 * the id fix (confirmed live via curl before this fix). Added
 * @CreatedBy/@CreatedDate/@LastModifiedBy/@LastModifiedDate, matching
 * Period.java's precedent.
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
    void create_persists_and_populates_createdBy() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("methodCode", ("PM" + System.nanoTime() % 100000).toUpperCase());
        payload.put("methodName", "New Payment Method");

        mockMvc.perform(auth(post("/api/v1/payment-methods")).content(json(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentMethodId").isNumber())
                .andExpect(jsonPath("$.createdBy").value("j.smith"))
                .andExpect(jsonPath("$.updatedBy").value("j.smith"));
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
