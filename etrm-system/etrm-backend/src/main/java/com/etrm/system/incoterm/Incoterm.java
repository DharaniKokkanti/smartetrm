package com.etrm.system.incoterm;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * dbo.incoterm is already registered in master_data_table_registry (generic
 * Tier 2) and was already read here for FK resolution (ProductService).
 * Upgraded in place to a full dedicated entity — the frontend's own
 * dedicated Incoterms page (features/reference/incoterms) called
 * /incoterms-ref expecting a dedicated controller that never existed,
 * 404ing against the real backend. `version` (IncotermVersion, e.g.
 * "INCOTERMS_2020") is derived from the real `version_year` SMALLINT column
 * rather than stored as a separate value — no live row's shape is lost,
 * just represented as the frontend's own enum on the way out/in.
 * `costResponsibility`/`titleTransfer` are new nullable columns (V114) —
 * the frontend's own type wanted them but the live table never had them.
 */
@Entity
@Table(name = "incoterm")
public class Incoterm {

    @Id
    @Column(name = "incoterm_id")
    private Integer incotermId;

    @NotBlank
    @Size(max = 10)
    @Column(name = "code", nullable = false, length = 10)
    private String code;

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @NotBlank
    @Size(max = 20)
    @Column(name = "transport_mode", nullable = false, length = 20)
    private String transportMode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "risk_transfer", nullable = false, length = 200)
    private String riskTransfer;

    @NotNull
    @Column(name = "version_year", nullable = false)
    private Short versionYear;

    @Size(max = 500)
    @Column(name = "cost_responsibility", length = 500)
    private String costResponsibility;

    @Size(max = 500)
    @Column(name = "title_transfer", length = 500)
    private String titleTransfer;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getIncotermId() {
        return incotermId;
    }

    public void setIncotermId(Integer incotermId) {
        this.incotermId = incotermId;
    }

    @JsonProperty("incotermCode")
    public String getCode() {
        return code;
    }

    @JsonProperty("incotermCode")
    public void setCode(String code) {
        this.code = code;
    }

    @JsonProperty("incotermName")
    public String getName() {
        return name;
    }

    @JsonProperty("incotermName")
    public void setName(String name) {
        this.name = name;
    }

    public String getTransportMode() {
        return transportMode;
    }

    public void setTransportMode(String transportMode) {
        this.transportMode = transportMode;
    }

    @JsonProperty("riskTransferPoint")
    public String getRiskTransfer() {
        return riskTransfer;
    }

    @JsonProperty("riskTransferPoint")
    public void setRiskTransfer(String riskTransfer) {
        this.riskTransfer = riskTransfer;
    }

    public Short getVersionYear() {
        return versionYear;
    }

    public void setVersionYear(Short versionYear) {
        this.versionYear = versionYear;
    }

    /** Derived from version_year — frontend's IncotermVersion enum, e.g. "INCOTERMS_2020". */
    @Transient
    @JsonProperty("version")
    public String getVersion() {
        return versionYear == null ? null : "INCOTERMS_" + versionYear;
    }

    @JsonProperty("version")
    public void setVersion(String version) {
        if (version == null) return;
        this.versionYear = Short.parseShort(version.replace("INCOTERMS_", ""));
    }

    public String getCostResponsibility() {
        return costResponsibility;
    }

    public void setCostResponsibility(String costResponsibility) {
        this.costResponsibility = costResponsibility;
    }

    public String getTitleTransfer() {
        return titleTransfer;
    }

    public void setTitleTransfer(String titleTransfer) {
        this.titleTransfer = titleTransfer;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
