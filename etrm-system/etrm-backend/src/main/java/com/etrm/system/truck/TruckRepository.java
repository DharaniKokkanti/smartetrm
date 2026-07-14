package com.etrm.system.truck;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TruckRepository extends JpaRepository<Truck, Integer> {
    boolean existsByLicensePlateIgnoreCase(String licensePlate);
}
