package com.etrm.system.rinfuelcategory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RinFuelCategoryRepository extends JpaRepository<RinFuelCategory, Integer> {

    /**
     * Explicit JPQL rather than a derived findByDCodeIgnoreCase — the field
     * is named `dCode` (lowercase d, matching the frontend's own camelCase),
     * and Spring Data's method-name parser looks for a property literally
     * named "DCode", which doesn't resolve against `dCode` and throws
     * PathElementException at repository-bean-creation time (caught by
     * actually running the app/tests, not by `mvn compile`, which doesn't
     * validate Spring Data query derivation).
     */
    @Query("SELECT c FROM RinFuelCategory c WHERE UPPER(c.dCode) = UPPER(:dCode)")
    Optional<RinFuelCategory> findByDCodeIgnoreCase(@Param("dCode") String dCode);
}
