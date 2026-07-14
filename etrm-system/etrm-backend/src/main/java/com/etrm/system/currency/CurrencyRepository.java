package com.etrm.system.currency;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CurrencyRepository extends JpaRepository<Currency, Integer> {
    boolean existsByCurrencyCodeIgnoreCase(String currencyCode);
}
