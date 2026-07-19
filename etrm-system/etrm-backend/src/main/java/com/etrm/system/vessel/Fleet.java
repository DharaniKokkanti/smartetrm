package com.etrm.system.vessel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * dbo.fleet is served generically via the Tier2 reference-data mechanism (no
 * dedicated controller) — minimal read-only reader so VesselService can
 * resolve fleet_id -> its code/name for display.
 */
@Entity
@Table(name = "fleet")
public class Fleet {

    @Id
    @Column(name = "fleet_id")
    private Integer fleetId;

    // V132 — optimistic locking (Batch E, voyage-ops/maritime). See V127/LegalEntity for the pattern.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "fleet_code", nullable = false, length = 30)
    private String fleetCode;

    @Column(name = "fleet_name", nullable = false, length = 150)
    private String fleetName;

    public Integer getFleetId() {
        return fleetId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public String getFleetCode() {
        return fleetCode;
    }

    public String getFleetName() {
        return fleetName;
    }
}
