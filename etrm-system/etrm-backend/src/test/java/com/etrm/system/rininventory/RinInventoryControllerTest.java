package com.etrm.system.rininventory;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * dbo.rin_inventory doesn't exist as a table — RinInventoryController
 * aggregates balances live from rin_transaction and has no write endpoints
 * at all, so this only covers GET /api/v1/rin-inventory and unauthenticated
 * access. A simple 200+array check is sufficient; no test data setup is
 * needed since an empty aggregate result is still a valid array.
 */
class RinInventoryControllerTest extends ApiTestBase {

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/rin-inventory")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/rin-inventory"))
                .andExpect(status().isForbidden());
    }
}
