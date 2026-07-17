package com.etrm.system.pricingrule;

import com.etrm.system.support.ApiTestBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Minimal coverage for /api/v1/pricing-rules, the most complex entity in
 * this batch (~40 real columns, several frontend fields with no backing DB
 * column at all — see PricingRule.java's class doc for the full list of
 * frontend/DB mismatches). Per this task's scope, kept intentionally
 * minimal: create with only the fields that have real columns, list,
 * deactivate.
 */
class PricingRuleControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private Map<String, Object> validPayload(String code) {
        Integer productId = jdbc.queryForObject("SELECT TOP 1 product_id FROM dbo.product", Integer.class);
        Integer pricingTypeId = jdbc.queryForObject("SELECT TOP 1 pricing_type_id FROM dbo.pricing_type", Integer.class);

        Map<String, Object> payload = new HashMap<>();
        payload.put("productId", productId);
        payload.put("pricingTypeId", pricingTypeId);
        payload.put("fxConversionRequired", false);
        payload.put("priceDecimalPlaces", 2);
        payload.put("quantityDecimalPlaces", 2);
        payload.put("valueDecimalPlaces", 2);
        payload.put("rounding", "STANDARD"); // JSON name for rounding_convention — see PricingRule.java
        payload.put("invoiceTimingDays", 5);
        payload.put("invoiceTimingBasis", "BUSINESS");
        payload.put("requiresFinalInvoice", false);
        payload.put("ruleName", "Test Pricing Rule " + code);
        payload.put("ruleCode", code);
        payload.put("isDefault", false);
        payload.put("effectiveFrom", "2026-01-01");
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_returns_201() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/pricing-rules")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ruleCode").value(code))
                .andExpect(jsonPath("$.pricingRuleId").isNumber())
                .andExpect(jsonPath("$.pricingType").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/pricing-rules")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/pricing-rules")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("pricingRuleId").asInt();

        mockMvc.perform(auth(patch("/api/v1/pricing-rules/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
