package com.etrm.system.rbac;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppModuleRepository extends JpaRepository<AppModule, Integer> {
    List<AppModule> findAllByOrderBySortOrderAsc();
}
