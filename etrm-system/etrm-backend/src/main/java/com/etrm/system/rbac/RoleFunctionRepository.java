package com.etrm.system.rbac;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoleFunctionRepository extends JpaRepository<RoleFunction, Integer> {
    List<RoleFunction> findByRoleRoleId(Integer roleId);
    void deleteByRoleRoleId(Integer roleId);
}
