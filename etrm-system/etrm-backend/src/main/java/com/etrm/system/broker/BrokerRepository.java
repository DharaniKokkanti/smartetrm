package com.etrm.system.broker;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BrokerRepository extends JpaRepository<Broker, Integer> {
    boolean existsByBrokerCodeIgnoreCase(String brokerCode);
}
