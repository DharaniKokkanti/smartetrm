package com.etrm.system.desk;

import com.etrm.system.common.AuditableEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "desk")
public class Desk extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "desk_id")
    private Integer deskId;

    @NotNull
    @Column(name = "legal_entity_id", nullable = false)
    private Integer legalEntityId;

    // Denormalized, not persisted — resolved by DeskService for display,
    // matching the shape the frontend Desk type already commits to.
    @Transient
    @JsonProperty
    private String legalEntityCode;

    @NotBlank
    @Size(max = 20)
    @Column(name = "desk_code", nullable = false, length = 20)
    private String deskCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "desk_name", nullable = false, length = 200)
    private String deskName;

    // FK -> dbo.commodity_type(commodity_type_id) (V85). Nullable: multi-commodity desk.
    @Column(name = "commodity_type")
    private Integer commodityType;

    @Column(name = "head_trader_id")
    private Integer headTraderId;

    @Transient
    @JsonProperty
    private String headTraderName;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    public Integer getDeskId() {
        return deskId;
    }

    public void setDeskId(Integer deskId) {
        this.deskId = deskId;
    }

    public Integer getLegalEntityId() {
        return legalEntityId;
    }

    public void setLegalEntityId(Integer legalEntityId) {
        this.legalEntityId = legalEntityId;
    }

    public String getLegalEntityCode() {
        return legalEntityCode;
    }

    public void setLegalEntityCode(String legalEntityCode) {
        this.legalEntityCode = legalEntityCode;
    }

    public String getDeskCode() {
        return deskCode;
    }

    public void setDeskCode(String deskCode) {
        this.deskCode = deskCode;
    }

    public String getDeskName() {
        return deskName;
    }

    public void setDeskName(String deskName) {
        this.deskName = deskName;
    }

    public Integer getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(Integer commodityType) {
        this.commodityType = commodityType;
    }

    public Integer getHeadTraderId() {
        return headTraderId;
    }

    public void setHeadTraderId(Integer headTraderId) {
        this.headTraderId = headTraderId;
    }

    public String getHeadTraderName() {
        return headTraderName;
    }

    public void setHeadTraderName(String headTraderName) {
        this.headTraderName = headTraderName;
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
}
