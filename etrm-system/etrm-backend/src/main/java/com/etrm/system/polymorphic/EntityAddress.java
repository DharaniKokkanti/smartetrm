package com.etrm.system.polymorphic;

import com.etrm.system.common.AuditableEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

/**
 * M:M link between an Address (pool record) and any entity that uses it.
 * One address row can appear via multiple EntityAddress rows — e.g., the same
 * registered office shared by a Legal Entity and a Counterparty.
 */
@Entity
@Table(name = "entity_address")
public class EntityAddress extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "entity_address_id")
    private Integer entityAddressId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 20)
    private EntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "address_id", nullable = false)
    private Address address;

    @NotBlank
    @Column(name = "address_type", nullable = false, length = 30)
    private String addressType = "REGISTERED";

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "notes", length = 500)
    private String notes;

    public Integer getEntityAddressId() { return entityAddressId; }
    public Integer getRowVersion() { return rowVersion; }
    public void setRowVersion(Integer rowVersion) { this.rowVersion = rowVersion; }
    public void setEntityAddressId(Integer entityAddressId) { this.entityAddressId = entityAddressId; }

    public EntityType getEntityType() { return entityType; }
    public void setEntityType(EntityType entityType) { this.entityType = entityType; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }

    public String getAddressType() { return addressType; }
    public void setAddressType(String addressType) { this.addressType = addressType; }

    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
