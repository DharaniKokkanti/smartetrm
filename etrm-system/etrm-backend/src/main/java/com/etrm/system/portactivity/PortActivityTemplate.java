package com.etrm.system.portactivity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.port_activity_template is served generically via the Tier2
 * reference-data mechanism (no dedicated controller) — minimal read-only
 * reader so PortActivityTemplateStepService can resolve template_id -> its
 * code/name for display.
 */
@Entity
@Table(name = "port_activity_template")
public class PortActivityTemplate {

    @Id
    @Column(name = "template_id")
    private Integer templateId;

    @Column(name = "template_code", nullable = false, length = 30)
    private String templateCode;

    @Column(name = "template_name", nullable = false, length = 150)
    private String templateName;

    public Integer getTemplateId() {
        return templateId;
    }

    public String getTemplateCode() {
        return templateCode;
    }

    public String getTemplateName() {
        return templateName;
    }
}
