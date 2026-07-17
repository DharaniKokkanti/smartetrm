package com.etrm.system.rininventory;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Response shape matches etrm-frontend/src/features/rins/rin-inventory/types.ts exactly. */
public record RinInventoryItem(
        Integer inventoryId,
        Integer accountId,
        String accountName,
        String dCode,
        String fuelName,
        Short vintageYear,
        Long quantity,
        BigDecimal avgCostPerRin,
        BigDecimal totalValue,
        LocalDate asOfDate
) {
}
