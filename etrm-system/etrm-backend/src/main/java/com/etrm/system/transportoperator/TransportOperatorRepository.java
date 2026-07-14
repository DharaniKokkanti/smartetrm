package com.etrm.system.transportoperator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransportOperatorRepository extends JpaRepository<TransportOperator, Integer> {
    // Used by TruckService to bridge the frontend's free-text operatorName
    // (Truck has no operatorId field at all, unlike Container/Railcar) onto
    // the real NOT NULL operator_id FK — same bridging technique as
    // PipelinePoint's findByPointCodeIgnoreCase.
    Optional<TransportOperator> findByOperatorNameIgnoreCase(String operatorName);
}
