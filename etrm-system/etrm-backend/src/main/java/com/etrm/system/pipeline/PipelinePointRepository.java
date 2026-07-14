package com.etrm.system.pipeline;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PipelinePointRepository extends JpaRepository<PipelinePoint, Integer> {
    Optional<PipelinePoint> findByPointCodeIgnoreCase(String pointCode);
}
