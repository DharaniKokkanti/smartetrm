package com.etrm.system.gtc;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.gtc is NOT registered in master_data_table_registry — contracts/gtcs
 * is a bespoke frontend page with no backend yet (Contract & Legal batch,
 * not started). Also: the real schema models gtc (1) -> gtc_version (N),
 * but the frontend's own Gtc type already flattens this into one row per
 * GTC with a single `version: string` field — a full GtcController will
 * need to resolve that simplification (probably "current version" only,
 * matching gtc_version.is_current), not something to solve here. This
 * entity is read-only for now, added early only so CpGtcAgreementService
 * can resolve gtc names for display.
 */
@Entity
@Table(name = "gtc")
public class Gtc {

    @Id
    @Column(name = "gtc_id")
    private Integer gtcId;

    @Column(name = "gtc_name", nullable = false, length = 200)
    private String gtcName;

    public Integer getGtcId() {
        return gtcId;
    }

    public String getGtcName() {
        return gtcName;
    }
}
