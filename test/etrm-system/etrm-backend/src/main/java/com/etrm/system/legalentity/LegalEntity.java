package com.etrm.system.legalentity;

import com.etrm.system.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "legal_entity")
public class LegalEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "legal_entity_id")
    private Long legalEntityId;

    @NotBlank
    @Size(max = 20)
    @Column(name = "entity_code", nullable = false, length = 20)
    private String entityCode;

    @NotBlank
    @Column(name = "entity_name", nullable = false, length = 200)
    private String entityName;

    @NotBlank
    @Column(name = "short_name", nullable = false, length = 100)
    private String shortName;

    @Column(name = "lei_code", length = 20)
    private String leiCode;

    @NotBlank
    @Column(name = "entity_type", nullable = false, length = 30)
    private String entityType;

    @Column(name = "parent_entity_id")
    private Long parentEntityId;

    @NotBlank
    @Size(min = 2, max = 2)
    @Column(name = "jurisdiction", nullable = false, length = 2)
    private String jurisdiction;

    @Size(min = 2, max = 2)
    @Column(name = "incorporation_country", length = 2)
    private String incorporationCountry;

    @Column(name = "incorporation_number", length = 100)
    private String incorporationNumber;

    @NotBlank
    @Size(min = 3, max = 3)
    @Column(name = "base_currency", nullable = false, length = 3)
    private String baseCurrency;

    @Column(name = "default_timezone", length = 50)
    private String defaultTimezone;

    @Column(name = "regulator", length = 100)
    private String regulator;

    @Column(name = "regulatory_licence", length = 100)
    private String regulatoryLicence;

    @Column(name = "is_internal", nullable = false)
    private Boolean isInternal = true;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "go_live_date")
    private LocalDate goLiveDate;

    @Column(name = "deactivated_date")
    private LocalDate deactivatedDate;

    @Column(name = "notes", length = 1000)
    private String notes;
}
