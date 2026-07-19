package com.etrm.system.laytime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * dbo.laytime_term_template is served generically via the Tier2
 * reference-data mechanism (no dedicated controller) — this is a minimal
 * read-only reader so CharterPartyService/LaytimeCalculationService can
 * resolve laytime_term_id -> its code/name for display.
 */
@Entity
@Table(name = "laytime_term_template")
public class LaytimeTermTemplate {

    @Id
    @Column(name = "laytime_term_id")
    private Integer laytimeTermId;

    // V132 — optimistic locking (Batch E, voyage-ops/maritime). See V127/LegalEntity for the pattern.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "term_code", nullable = false, length = 20)
    private String termCode;

    @Column(name = "term_name", nullable = false, length = 150)
    private String termName;

    public Integer getLaytimeTermId() {
        return laytimeTermId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public String getTermCode() {
        return termCode;
    }

    public String getTermName() {
        return termName;
    }
}
