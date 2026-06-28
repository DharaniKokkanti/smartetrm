package com.etrm.system.rbac;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoleFunctionRepository extends JpaRepository<RoleFunction, Long> {
    List<RoleFunction> findByRoleRoleId(Long roleId);
    void deleteByRoleRoleId(Long roleId);
}
