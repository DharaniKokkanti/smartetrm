package com.etrm.system.desk;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DeskRepository extends JpaRepository<Desk, Integer> {
    boolean existsByDeskCodeIgnoreCase(String deskCode);
}
