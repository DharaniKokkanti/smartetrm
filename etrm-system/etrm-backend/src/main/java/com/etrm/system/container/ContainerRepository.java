package com.etrm.system.container;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ContainerRepository extends JpaRepository<Container, Integer> {
    boolean existsByContainerNumberIgnoreCase(String containerNumber);
}
