package com.etrm.system.location;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LocationRoleAssignmentRepository extends JpaRepository<LocationRoleAssignment, Integer> {
    List<LocationRoleAssignment> findByLocationIdOrderByLocationTypeIdAsc(Integer locationId);
    boolean existsByLocationIdAndLocationTypeId(Integer locationId, Integer locationTypeId);
}
