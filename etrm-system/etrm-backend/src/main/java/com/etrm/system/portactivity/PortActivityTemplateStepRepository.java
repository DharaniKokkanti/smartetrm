package com.etrm.system.portactivity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortActivityTemplateStepRepository extends JpaRepository<PortActivityTemplateStep, Integer> {
    List<PortActivityTemplateStep> findByTemplateIdOrderByStepSequenceAsc(Integer templateId);
}
