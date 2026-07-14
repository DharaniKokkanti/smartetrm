package com.etrm.system.commodity;

import java.util.Map;

/**
 * dbo.commodity has exactly 5 rows (OIL, POWER, GAS, AGRI, METALS) — the
 * broad top-level commodity classification. The frontend's CommodityType
 * union (organization/desks/types.ts) is a superset of this plus MULTI/
 * OTHER/LNG/etc., and products/types.ts's COMMODITY_CODE_TO_TYPE already
 * hand-maps AGRI -> 'AGRICULTURAL' (the one code that doesn't match its
 * frontend type name 1:1). Mirrored here, server-side, so Market/PriceIndex
 * can resolve commodity_id <-> the frontend's plain string field without
 * duplicating a full commodity_type FK-conversion migration for what's
 * really just a 5-value, rarely-changing classification.
 */
public final class CommodityTypeMapping {

    private static final Map<String, String> CODE_TO_TYPE = Map.of(
            "OIL", "OIL",
            "POWER", "POWER",
            "GAS", "GAS",
            "AGRI", "AGRICULTURAL",
            "METALS", "METALS"
    );

    private static final Map<String, String> TYPE_TO_CODE = Map.of(
            "OIL", "OIL",
            "POWER", "POWER",
            "GAS", "GAS",
            "AGRICULTURAL", "AGRI",
            "METALS", "METALS"
    );

    private CommodityTypeMapping() {
    }

    public static String codeToType(String commodityCode) {
        return CODE_TO_TYPE.get(commodityCode);
    }

    public static String typeToCode(String commodityType) {
        return TYPE_TO_CODE.get(commodityType);
    }
}
