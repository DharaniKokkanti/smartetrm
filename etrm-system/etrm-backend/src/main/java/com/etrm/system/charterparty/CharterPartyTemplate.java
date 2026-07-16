package com.etrm.system.charterparty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.charter_party_template is served generically via the Tier2
 * reference-data mechanism (no dedicated controller) — minimal read-only
 * reader so CharterPartyService can resolve charter_party_template_id ->
 * its code/name for display.
 */
@Entity
@Table(name = "charter_party_template")
public class CharterPartyTemplate {

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
