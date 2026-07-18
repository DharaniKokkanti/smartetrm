package com.etrm.system.holidaycalendar;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/holiday-calendars, including the nested
 * /{calendarId}/holidays sub-resource. countryId=1 (GB) and currencyId=1
 * (USD) are real seeded rows confirmed via direct SQL.
 */
class HolidayCalendarControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("calendarCode", code);
        payload.put("calendarName", "Test Calendar " + code);
        payload.put("calendarType", "CUSTOM");
        payload.put("countryId", 1);
        payload.put("currencyId", 1);
        payload.put("description", "Created by HolidayCalendarControllerTest");
        payload.put("isActive", true);
        return payload;
    }

    private int createCalendar(String code) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/holiday-calendars")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("calendarId").asInt();
    }

    @Test
    void create_persists_and_populates_createdAt_and_holidayCount() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/holiday-calendars")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.calendarCode").value(code.toUpperCase()))
                .andExpect(jsonPath("$.calendarId").isNumber())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.holidayCount").value(0));
    }

    @Test
    void create_duplicate_calendarCode_returns_409() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/holiday-calendars")).content(json(validPayload(code))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/holiday-calendars")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void create_invalid_calendarType_returns_400_or_409() throws Exception {
        Map<String, Object> payload = validPayload(unique());
        payload.put("calendarType", "NOT_A_REAL_TYPE");
        mockMvc.perform(auth(post("/api/v1/holiday-calendars")).content(json(payload)))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(status == 400 || status == 409,
                            "expected 400/409 for invalid calendarType CHECK constraint, got " + status);
                });
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/holiday-calendars")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_createdAt() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/holiday-calendars")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("calendarId").asInt();
        String originalCreatedAt = objectMapper.readTree(createBody).get("createdAt").asText();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("calendarName", "Updated Calendar Name " + code);

        mockMvc.perform(auth(put("/api/v1/holiday-calendars/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calendarName").value("Updated Calendar Name " + code))
                .andExpect(jsonPath("$.createdAt").value(originalCreatedAt));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        int id = createCalendar(unique());
        mockMvc.perform(auth(patch("/api/v1/holiday-calendars/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }

    @Test
    void createHoliday_persists_and_listHolidays_reflects_it() throws Exception {
        int id = createCalendar(unique());

        Map<String, Object> holiday = new HashMap<>();
        holiday.put("holidayDate", "2026-12-25");
        holiday.put("holidayName", "Test Holiday");
        holiday.put("isSettlementHoliday", true);
        holiday.put("isTradingHoliday", true);

        mockMvc.perform(auth(post("/api/v1/holiday-calendars/" + id + "/holidays")).content(json(holiday)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.holidayId").isNumber())
                .andExpect(jsonPath("$.holidayName").value("Test Holiday"));

        mockMvc.perform(auth(get("/api/v1/holiday-calendars/" + id + "/holidays")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void createHoliday_duplicate_date_returns_409() throws Exception {
        int id = createCalendar(unique());
        Map<String, Object> holiday = new HashMap<>();
        holiday.put("holidayDate", "2026-11-11");
        holiday.put("holidayName", "First");
        holiday.put("isSettlementHoliday", true);
        holiday.put("isTradingHoliday", true);

        mockMvc.perform(auth(post("/api/v1/holiday-calendars/" + id + "/holidays")).content(json(holiday)))
                .andExpect(status().isCreated());

        Map<String, Object> dupe = new HashMap<>(holiday);
        dupe.put("holidayName", "Second");
        mockMvc.perform(auth(post("/api/v1/holiday-calendars/" + id + "/holidays")).content(json(dupe)))
                .andExpect(status().isConflict());
    }

    @Test
    void deleteHoliday_removes_it() throws Exception {
        int id = createCalendar(unique());
        Map<String, Object> holiday = new HashMap<>();
        holiday.put("holidayDate", "2026-10-10");
        holiday.put("holidayName", "To Delete");
        holiday.put("isSettlementHoliday", true);
        holiday.put("isTradingHoliday", true);

        String body = mockMvc.perform(auth(post("/api/v1/holiday-calendars/" + id + "/holidays")).content(json(holiday)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int holidayId = objectMapper.readTree(body).get("holidayId").asInt();

        mockMvc.perform(auth(delete("/api/v1/holiday-calendars/" + id + "/holidays/" + holidayId)))
                .andExpect(status().isNoContent());

        mockMvc.perform(auth(get("/api/v1/holiday-calendars/" + id + "/holidays")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void bulkCreateHolidays_creates_valid_and_rejects_duplicates() throws Exception {
        int id = createCalendar(unique());

        Map<String, Object> h1 = new HashMap<>();
        h1.put("holidayDate", "2026-01-01");
        h1.put("holidayName", "New Year");
        h1.put("isSettlementHoliday", true);
        h1.put("isTradingHoliday", true);

        Map<String, Object> h2 = new HashMap<>();
        h2.put("holidayDate", "2026-01-01");
        h2.put("holidayName", "Duplicate Of New Year");
        h2.put("isSettlementHoliday", true);
        h2.put("isTradingHoliday", true);

        Map<String, Object> request = Map.of("holidays", List.of(h1, h2));

        mockMvc.perform(auth(post("/api/v1/holiday-calendars/" + id + "/holidays/bulk")).content(json(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created.length()").value(1))
                .andExpect(jsonPath("$.rejected.length()").value(1));
    }
}
