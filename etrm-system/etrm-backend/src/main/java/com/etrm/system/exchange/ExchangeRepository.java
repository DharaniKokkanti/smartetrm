package com.etrm.system.exchange;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExchangeRepository extends JpaRepository<Exchange, Integer> {
    boolean existsByExchangeCodeIgnoreCase(String exchangeCode);
}
