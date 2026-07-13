package com.etrm.system.rbac;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, Integer> {
    List<UserRoleAssignment> findByUserId(Integer userId);
    List<UserRoleAssignment> findByUserIdAndIsActiveTrue(Integer userId);
    Optional<UserRoleAssignment> findByUserIdAndRoleRoleIdAndIsActiveTrue(Integer userId, Integer roleId);
}
