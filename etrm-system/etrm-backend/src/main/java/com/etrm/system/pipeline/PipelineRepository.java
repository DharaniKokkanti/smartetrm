package com.etrm.system.pipeline;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PipelineRepository extends JpaRepository<Pipeline, Integer> {
    boolean existsByPipelineCodeIgnoreCase(String pipelineCode);
}
