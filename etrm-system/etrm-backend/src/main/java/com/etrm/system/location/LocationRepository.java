package com.etrm.system.location;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, Integer> {
    boolean existsByLocationCodeIgnoreCase(String locationCode);
}
