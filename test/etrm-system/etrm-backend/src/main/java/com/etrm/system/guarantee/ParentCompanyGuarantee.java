package com.etrm.system.guarantee;

import com.etrm.system.common.AuditableEntity;
import com.etrm.system.polymorphic.EntityType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "parent_company_guarantee")
public class ParentCompanyGuarantee extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pcg_id")
    private Long pcgId;

    @NotBlank
    @Column(name = "pcg_reference", nullable = false, length = 50)
    private String pcgReference;

    @NotBlank
    @Column(name = "direction", nullable = false, length = 20)
    private String direction;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "guarantor_entity_type", nullable = false, length = 20)
    private EntityType guarantorEntityType;

    @NotNull
    @Column(name = "guarantor_entity_id", nullable = false)
    private Long guarantorEntityId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "principal_entity_type", nullable = false, length = 20)
    private EntityType principalEntityType;

    @NotNull
    @Column(name = "principal_entity_id", nullable = false)
    private Long principalEntityId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "beneficiary_entity_type", nullable = false, length = 20)
    private EntityType beneficiaryEntityType;

    @NotNull
    @Column(name = "beneficiary_entity_id", nullable = false)
    private Long beneficiaryEntityId;

    @NotNull
    @Column(name = "guarantee_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal guaranteeAmount;

    @NotNull
    @Column(name = "currency_id", nullable = false)
    private Long currencyId;

    @NotNull
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "is_evergreen", nullable = false)
    private Boolean isEvergreen = false;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @NotBlank
    @Column(name = "pcg_status", nullable = false, length = 20)
    private String pcgStatus = "DRAFT";

    @Column(name = "amount_called", precision = 18, scale = 2)
    private BigDecimal amountCalled;

    @Column(name = "document_store_id")
    private Long documentStoreId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "notes", length = 500)
    private String notes;
}
