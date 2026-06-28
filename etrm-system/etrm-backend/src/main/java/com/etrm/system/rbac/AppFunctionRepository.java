package com.etrm.system.rbac;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppFunctionRepository extends JpaRepository<AppFunction, Long> {
    List<AppFunction> findAllByOrderByModuleModuleIdAscSortOrderAsc();
}
