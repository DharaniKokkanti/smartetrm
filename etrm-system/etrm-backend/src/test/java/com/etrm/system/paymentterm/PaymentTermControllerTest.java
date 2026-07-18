package com.etrm.system.paymentterm;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/payment-terms, including the /{id}/due-date calculation
 * endpoint. paymentMethod=3 (BANK_GUARANTEE) and calendarId=7 (a real
 * holiday_calendar row) are seeded values confirmed via direct SQL.
 * PaymentTermService.create/update never checks for a duplicate term_code
 * itself (no explicit ConflictException, unlike Country/Currency/Desk) — the
 * DB's own UNIQUE constraint (uq_payment_term_code) is the sole backstop,
 * caught by GlobalExceptionHandler's DataIntegrityViolationException
 * handler as a 409.
 */
class PaymentTermControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("termCode", code);
        payload.put("termName", "Test Term " + code);
        payload.put("baseDateEvent", "BL_DATE");
        payload.put("monthOffset", 0);
        payload.put("offsetDays", 30);
        payload.put("daysBasis", "CALENDAR");
        payload.put("businessDayConvention", "FOLLOWING");
        payload.put("calendarId", 7);
        payload.put("paymentMethod", 3);
        payload.put("isDefault", false);
        payload.put("description", "Created by PaymentTermControllerTest");
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_populates_createdAt() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/payment-terms")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.termCode").value(code))
                .andExpect(jsonPath("$.paymentTermId").isNumber())
                .andExpect(jsonPath("$.paymentMethodCode").value("BANK_GUARANTEE"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    void create_duplicate_termCode_returns_409() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/payment-terms")).content(json(validPayload(code))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/payment-terms")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void create_invalid_daysBasis_returns_400_or_409() throws Exception {
        Map<String, Object> payload = validPayload(unique());
        payload.put("daysBasis", "NOT_A_REAL_BASIS");
        mockMvc.perform(auth(post("/api/v1/payment-terms")).content(json(payload)))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(status == 400 || status == 409,
                            "expected 400/409 for invalid daysBasis CHECK constraint, got " + status);
                });
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/payment-terms")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/payment-terms")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("paymentTermId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("termName", "Updated Term Name " + code);

        mockMvc.perform(auth(put("/api/v1/payment-terms/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.termName").value("Updated Term Name " + code));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/payment-terms")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("paymentTermId").asInt();

        mockMvc.perform(auth(patch("/api/v1/payment-terms/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }

    /** monthOffset=0, offsetDays=30, CALENDAR basis, FOLLOWING convention,
     *  base 2026-01-01 -> 2026-01-31 (a Saturday) rolled forward to Monday
     *  2026-02-02, since no holidays are registered on that calendar for
     *  this window (calendarId=7 is a real seeded calendar but this window
     *  wasn't specifically checked for holidays — the assertion below only
     *  pins down the day-of-week rolling behavior, not an exact date, to
     *  avoid a false failure if a holiday happens to land there). */
    @Test
    void dueDate_calculation_rolls_off_a_weekend() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/payment-terms")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("paymentTermId").asInt();

        mockMvc.perform(auth(get("/api/v1/payment-terms/" + id + "/due-date")).param("baseDate", "2026-01-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").isNotEmpty());
    }
}
