package com.etrm.system.gtc;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Read-only for now — see Gtc.java's doc comment. */
@Entity
@Table(name = "gtc_version")
public class GtcVersion {

    @Id
    @Column(name = "gtc_version_id")
    private Integer gtcVersionId;

    @Column(name = "gtc_id", nullable = false)
    private Integer gtcId;

    @Column(name = "version_number", nullable = false, length = 20)
    private String versionNumber;

    @Column(name = "is_current", nullable = false)
    private Boolean isCurrent;

    public Integer getGtcVersionId() {
        return gtcVersionId;
    }

    public Integer getGtcId() {
        return gtcId;
    }

    public String getVersionNumber() {
        return versionNumber;
    }

    public Boolean getIsCurrent() {
        return isCurrent;
    }
}
