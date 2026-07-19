package com.etrm.system.transportoperator;

import com.etrm.system.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * dbo.transport_operator has no frontend page of its own yet in this batch —
 * built read/write-capable (full audit columns via AuditableEntity) purely
 * as an FK-resolution target: Vessel (owner_operator_id/manager_operator_id),
 * Pipeline (operator_id/owner_operator_id), Truck (operator_id), Container
 * (operator_id) and Railcar (operator_id) all FK into this table and resolve
 * operatorName for display. No controller in this batch.
 */
@Entity
@Table(name = "transport_operator")
public class TransportOperator extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "operator_id")
    private Integer operatorId;

    // V130 — optimistic locking (Batch C: Logistics). No dedicated
    // frontend page exists for this table yet (see class doc comment above),
    // but the column/annotation is added for consistency with the rest of
    // this batch.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 20)
    @Column(name = "operator_code", nullable = false, length = 20)
    private String operatorCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "operator_name", nullable = false, length = 200)
    private String operatorName;

    @Column(name = "mot_type_id")
    private Integer motTypeId;

    @Column(name = "counterparty_id")
    private Integer counterpartyId;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @NotNull
    @Column(name = "operator_type", nullable = false)
    private Integer operatorType;

    @Column(name = "country_id")
    private Integer countryId;

    public Integer getOperatorId() {
        return operatorId;
    }

    public void setOperatorId(Integer operatorId) {
        this.operatorId = operatorId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getOperatorCode() {
        return operatorCode;
    }

    public void setOperatorCode(String operatorCode) {
        this.operatorCode = operatorCode;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }

    public Integer getMotTypeId() {
        return motTypeId;
    }

    public void setMotTypeId(Integer motTypeId) {
        this.motTypeId = motTypeId;
    }

    public Integer getCounterpartyId() {
        return counterpartyId;
    }

    public void setCounterpartyId(Integer counterpartyId) {
        this.counterpartyId = counterpartyId;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getOperatorType() {
        return operatorType;
    }

    public void setOperatorType(Integer operatorType) {
        this.operatorType = operatorType;
    }

    public Integer getCountryId() {
        return countryId;
    }

    public void setCountryId(Integer countryId) {
        this.countryId = countryId;
    }
}
