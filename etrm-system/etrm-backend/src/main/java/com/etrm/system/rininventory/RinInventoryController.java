package com.etrm.system.rininventory;

import com.etrm.system.rinaccount.RinAccountRepository;
import com.etrm.system.rinfuelcategory.RinFuelCategoryRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * GET-only — path must stay in sync with
 * etrm-frontend/src/features/rins/rin-inventory/api.ts. Balances are
 * aggregated live from rin_transaction (see RinInventoryRepository) rather
 * than a separate stored table.
 */
@RestController
@RequestMapping("/api/v1/rin-inventory")
public class RinInventoryController {

    private final RinInventoryRepository repository;
    private final RinAccountRepository accountRepository;
    private final RinFuelCategoryRepository fuelCategoryRepository;

    public RinInventoryController(RinInventoryRepository repository, RinAccountRepository accountRepository,
                                   RinFuelCategoryRepository fuelCategoryRepository) {
        this.repository = repository;
        this.accountRepository = accountRepository;
        this.fuelCategoryRepository = fuelCategoryRepository;
    }

    @GetMapping
    public List<RinInventoryItem> list() {
        LocalDate today = LocalDate.now();
        return repository.aggregateBalances().stream()
                .map(row -> {
                    String accountName = accountRepository.findById(row.accountId())
                            .map(a -> a.getAccountName()).orElse(null);
                    String fuelName = fuelCategoryRepository.findByDCodeIgnoreCase(row.dCode())
                            .map(f -> f.getFuelName()).orElse(null);
                    BigDecimal avgCost = row.pricedQuantitySum() != null && row.pricedQuantitySum() > 0
                            ? row.pricedValueSum().divide(BigDecimal.valueOf(row.pricedQuantitySum()), 6, RoundingMode.HALF_UP)
                            : null;
                    BigDecimal totalValue = avgCost != null ? avgCost.multiply(BigDecimal.valueOf(row.quantity())) : null;
                    // Synthetic id — this is a computed aggregate, not a real table row.
                    int inventoryId = (row.accountId() + "-" + row.dCode() + "-" + row.vintageYear()).hashCode();
                    return new RinInventoryItem(inventoryId, row.accountId(), accountName, row.dCode(), fuelName,
                            row.vintageYear(), row.quantity(), avgCost, totalValue, today);
                })
                .toList();
    }
}
