package com.etrm.system.rbac;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, Long> {
    List<UserRoleAssignment> findByUserId(Long userId);
    List<UserRoleAssignment> findByUserIdAndIsActiveTrue(Long userId);
    Optional<UserRoleAssignment> findByUserIdAndRoleRoleIdAndIsActiveTrue(Long userId, Long roleId);
}
