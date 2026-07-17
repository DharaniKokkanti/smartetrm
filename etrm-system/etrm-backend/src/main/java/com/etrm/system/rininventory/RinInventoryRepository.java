package com.etrm.system.rininventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RinInventoryRepository extends JpaRepository<com.etrm.system.rintransaction.RinTransaction, Integer> {

    /**
     * Live balance per (account, d_code, vintage_year), aggregated from the
     * transaction ledger rather than stored — there's no separate mutable
     * inventory table (no batch/position-calc job exists in this codebase
     * to keep one in sync), so this is computed on read from rin_transaction
     * directly, the single source of truth the RIN transaction feature
     * already writes to. VOID transactions are excluded from the balance.
     * price is a simple quantity-weighted average across priced legs
     * (rows with a non-null price_per_rin) — a reasonable average cost
     * basis, not a FIFO/LIFO costing engine (out of scope here).
     */
    @Query("""
            SELECT new com.etrm.system.rininventory.RinInventoryRow(
                t.accountId, t.dCode, t.vintageYear,
                SUM(t.quantity),
                SUM(CASE WHEN t.pricePerRin IS NOT NULL THEN t.pricePerRin * t.quantity ELSE 0 END),
                SUM(CASE WHEN t.pricePerRin IS NOT NULL THEN t.quantity ELSE 0 END)
            )
            FROM RinTransaction t
            WHERE t.status <> 'VOID'
            GROUP BY t.accountId, t.dCode, t.vintageYear
            """)
    List<RinInventoryRow> aggregateBalances();
}
