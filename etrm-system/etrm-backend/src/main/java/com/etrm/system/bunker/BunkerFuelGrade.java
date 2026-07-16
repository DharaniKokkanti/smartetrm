package com.etrm.system.bunker;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.bunker_fuel_grade is served generically via the Tier2 reference-data
 * mechanism (no dedicated controller) — minimal read-only reader so
 * BunkerStemService/VesselBunkerRobLedgerService can resolve
 * fuel_grade_id -> its code/name for display.
 */
@Entity
@Table(name = "bunker_fuel_grade")
public class BunkerFuelGrade {

    @Id
    @Column(name = "fuel_grade_id")
    private Integer fuelGradeId;

    @Column(name = "grade_code", nullable = false, length = 30)
    private String gradeCode;

    @Column(name = "grade_name", nullable = false, length = 150)
    private String gradeName;

    public Integer getFuelGradeId() {
        return fuelGradeId;
    }

    public String getGradeCode() {
        return gradeCode;
    }

    public String getGradeName() {
        return gradeName;
    }
}
