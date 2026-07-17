package com.etrm.system.rininventory;

import java.math.BigDecimal;

/** JPQL constructor-expression projection for RinInventoryRepository.aggregateBalances(). */
public record RinInventoryRow(
        Integer accountId,
        String dCode,
        Short vintageYear,
        Long quantity,
        BigDecimal pricedValueSum,
        Long pricedQuantitySum
) {
}
