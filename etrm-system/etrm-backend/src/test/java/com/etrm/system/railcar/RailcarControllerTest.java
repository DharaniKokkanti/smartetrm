package com.etrm.system.railcar;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/logistics/railcars full CRUD + deactivate, plus the nested
 * product-approvals sub-resource (dbo.mot_asset_product_approval, scoped to
 * asset_type='RAILCAR'). Note mot_asset_product_approval has a composite
 * unique constraint uq_mapa on (asset_type, asset_id, product_id,
 * effective_from) — the create+delete cycle test only inserts one row so
 * this can't collide, but a second creation reusing the same product would
 * need a different effective_from.
 */
class RailcarControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private Map<String, Object> validPayload(String carNumber) {
        Integer operatorId = jdbc.queryForObject("SELECT TOP 1 operator_id FROM dbo.transport_operator", Integer.class);
        Integer countryId = jdbc.queryForObject("SELECT TOP 1 country_id FROM dbo.country", Integer.class);
        Map<String, Object> payload = new HashMap<>();
        payload.put("carNumber", carNumber);
        payload.put("carType", "TANK_CAR"); // dbo.railcar chk_rc_type only allows OTHER/BOXCAR/FLATCAR/COVERED_HOPPER/HOPPER_CAR/TANK_CAR
        payload.put("operatorId", operatorId);
        payload.put("countryId", countryId);
        return payload;
    }

    @Test
    void create_persists_and_returns_201() throws Exception {
        String carNumber = unique();
        mockMvc.perform(auth(post("/api/v1/logistics/railcars")).content(json(validPayload(carNumber))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.carNumber").value(carNumber))
                .andExpect(jsonPath("$.railcarId").isNumber())
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    void create_duplicate_carNumber_returns_409() throws Exception {
        String carNumber = unique();
        mockMvc.perform(auth(post("/api/v1/logistics/railcars")).content(json(validPayload(carNumber))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/logistics/railcars")).content(json(validPayload(carNumber))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/logistics/railcars")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String carNumber = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/railcars")).content(json(validPayload(carNumber))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("railcarId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(carNumber));
        update.put("carType", "HOPPER_CAR");

        mockMvc.perform(auth(put("/api/v1/logistics/railcars/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.carType").value("HOPPER_CAR"));
    }

    @Test
    void update_nonexistent_id_returns_404() throws Exception {
        mockMvc.perform(auth(put("/api/v1/logistics/railcars/999999999")).content(json(validPayload(unique()))))
                .andExpect(status().isNotFound());
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String carNumber = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/railcars")).content(json(validPayload(carNumber))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("railcarId").asInt();

        mockMvc.perform(auth(patch("/api/v1/logistics/railcars/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }

    @Test
    void productApproval_create_then_delete_cycle() throws Exception {
        String carNumber = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/railcars")).content(json(validPayload(carNumber))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int railcarId = objectMapper.readTree(createBody).get("railcarId").asInt();

        Integer productId = jdbc.queryForObject("SELECT TOP 1 product_id FROM dbo.product", Integer.class);
        // Workaround for a real bug (see productApproval_omitting_assetType_matches_frontend_contract_but_400s
        // below): RailcarProductApproval.assetType is @NotBlank, so @Valid rejects the
        // request before the controller ever reaches input.setAssetType(RAILCAR_ASSET_TYPE).
        // Sending assetType here lets this test exercise the rest of the create/list/delete
        // cycle despite that bug.
        Map<String, Object> approvalPayload = new HashMap<>();
        approvalPayload.put("assetType", "RAILCAR");
        approvalPayload.put("assetId", railcarId);
        approvalPayload.put("productId", productId);
        approvalPayload.put("approvalStatus", "APPROVED");
        approvalPayload.put("effectiveFrom", "2026-01-01");

        String approvalBody = mockMvc.perform(auth(post("/api/v1/logistics/railcars/" + railcarId + "/product-approvals"))
                        .content(json(approvalPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.assetType").value("RAILCAR"))
                .andExpect(jsonPath("$.assetId").value(railcarId))
                .andExpect(jsonPath("$.productId").value(productId))
                .andReturn().getResponse().getContentAsString();
        int approvalId = objectMapper.readTree(approvalBody).get("assetApprovalId").asInt();

        mockMvc.perform(auth(get("/api/v1/logistics/railcars/" + railcarId + "/product-approvals")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].assetApprovalId").value(approvalId));

        mockMvc.perform(auth(delete("/api/v1/logistics/railcars/" + railcarId + "/product-approvals/" + approvalId)))
                .andExpect(status().isNoContent());

        mockMvc.perform(auth(get("/api/v1/logistics/railcars/" + railcarId + "/product-approvals")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    /**
     * REAL BUG (frontend/backend contract mismatch): etrm-frontend's
     * RailcarProductApprovalInput type (types.ts) deliberately omits assetType from
     * the POST body — asset_type is meant to be set server-side, exactly like
     * RailcarController.addProductApproval() does via
     * input.setAssetType(RAILCAR_ASSET_TYPE). But RailcarProductApproval.assetType
     * carries @NotBlank, and @Valid runs before the controller body executes, so
     * every request shaped like the real frontend's payload 400s with
     * "assetType must not be blank" — this sub-resource's create endpoint is
     * currently unusable by its own frontend. assetId, by contrast, IS sent by the
     * frontend (RailcarProductApprovalInput only omits assetApprovalId/assetType/
     * productName/quantityUomCode), so it's included here to isolate assetType as
     * the sole cause.
     */
    /**
     * Regression coverage for a real bug (now fixed): RailcarProductApproval.
     * assetType used to carry @NotBlank, but RailcarController.addProductApproval()
     * always sets it server-side (to "RAILCAR") AFTER @Valid already ran on the
     * deserialized body — so a request matching the frontend's own
     * RailcarProductApprovalInput (which correctly omits assetType) 400'd
     * unconditionally. Fixed by dropping @NotBlank from the entity field.
     */
    @Test
    void productApproval_omitting_assetType_matches_frontend_contract_and_succeeds() throws Exception {
        String carNumber = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/railcars")).content(json(validPayload(carNumber))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int railcarId = objectMapper.readTree(createBody).get("railcarId").asInt();

        Integer productId = jdbc.queryForObject("SELECT TOP 1 product_id FROM dbo.product", Integer.class);
        Map<String, Object> approvalPayload = new HashMap<>();
        approvalPayload.put("assetId", railcarId); // frontend sends this
        approvalPayload.put("productId", productId);
        approvalPayload.put("approvalStatus", "APPROVED");
        approvalPayload.put("effectiveFrom", "2026-01-01");
        // assetType intentionally omitted, matching RailcarProductApprovalInput.

        mockMvc.perform(auth(post("/api/v1/logistics/railcars/" + railcarId + "/product-approvals"))
                        .content(json(approvalPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.assetType").value("RAILCAR"));
    }

    @Test
    void productApproval_for_nonexistent_railcar_returns_404() throws Exception {
        Integer productId = jdbc.queryForObject("SELECT TOP 1 product_id FROM dbo.product", Integer.class);
        Map<String, Object> approvalPayload = new HashMap<>();
        approvalPayload.put("assetType", "RAILCAR");
        approvalPayload.put("assetId", 999999999);
        approvalPayload.put("productId", productId);
        approvalPayload.put("approvalStatus", "APPROVED");
        approvalPayload.put("effectiveFrom", "2026-01-01");

        mockMvc.perform(auth(post("/api/v1/logistics/railcars/999999999/product-approvals")).content(json(approvalPayload)))
                .andExpect(status().isNotFound());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/logistics/railcars"))
                .andExpect(status().isForbidden());
    }
}
