package com.etrm.system.position;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * dbo.position is read-only via this API — populated entirely by a batch
 * calculation job elsewhere, not through any write endpoint here. Only
 * GET /api/v1/positions exists (see PositionController), so this only
 * covers list (with and without query params) and unauthenticated access.
 */
class PositionControllerTest extends ApiTestBase {

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/positions")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void list_with_commodityType_filter_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/positions").param("commodityType", "OIL")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void list_with_bookId_and_periodCode_filters_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/positions").param("bookId", "1").param("periodCode", "2026-08")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/positions"))
                .andExpect(status().isForbidden());
    }
}
