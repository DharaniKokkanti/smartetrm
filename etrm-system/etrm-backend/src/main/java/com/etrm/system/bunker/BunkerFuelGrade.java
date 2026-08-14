package com.etrm.system.bunker;

import com.etrm.system.common.SourceSystemDefaults;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * dbo.bunker_fuel_grade is served generically via the Tier2 reference-data
 * mechanism (no dedicated controller) — minimal read-only reader so
 * BunkerStemService/VesselBunkerRobLedgerService can resolve
 * fuel_grade_id -> its code/name for display.
 */
@Entity
@Table(name = "ref_bunker_fuel_grade")
public class BunkerFuelGrade {

    @Id
    @Column(name = "fuel_grade_id")
    private Integer fuelGradeId;

    // V130 — optimistic locking (Batch C: Logistics). No update path exists
    // for this read-only reference table today, but the column/annotation is
    // added for consistency with the rest of this batch.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "grade_code", nullable = false, length = 30)
    private String gradeCode;

    @Column(name = "grade_name", nullable = false, length = 150)
    private String gradeName;

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    private void onCreate() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    private void onUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    public Integer getFuelGradeId() {
        return fuelGradeId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getGradeCode() {
        return gradeCode;
    }

    public String getGradeName() {
        return gradeName;
    }

    public Short getCreatedSrcId() {
        return createdSrcId;
    }

    public Short getUpdatedSrcId() {
        return updatedSrcId;
    }
}
