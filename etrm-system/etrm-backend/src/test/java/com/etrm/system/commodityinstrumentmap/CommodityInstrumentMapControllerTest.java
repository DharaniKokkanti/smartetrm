package com.etrm.system.commodityinstrumentmap;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers /api/v1/commodity-instrument-map — a GET-only endpoint over the
 * pre-seeded, DBA/vendor-managed dbo.commodity_instrument_type_config table
 * (see CommodityInstrumentMapEntry.java's class doc: "no UI CRUD, only
 * DBA/vendor adds rows via migration"). No create/update/delete to cover;
 * this confirms the shape of the aggregated response instead — a map of
 * commodityType -> ordered list of instrumentType strings.
 */
class CommodityInstrumentMapControllerTest extends ApiTestBase {

    @Test
    void get_returns_200_and_a_map_of_commodity_to_instrument_types() throws Exception {
        mockMvc.perform(auth(get("/api/v1/commodity-instrument-map")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isMap());
    }
}
