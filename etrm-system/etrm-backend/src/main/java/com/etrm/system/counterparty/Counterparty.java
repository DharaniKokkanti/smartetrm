package com.etrm.system.counterparty;

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

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "counterparty")
public class Counterparty extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "counterparty_id")
    private Long counterpartyId;

    @NotBlank
    @Size(max = 20)
    @Column(name = "cp_code", nullable = false, length = 20)
    private String cpCode;

    @NotBlank
    @Column(name = "legal_name", nullable = false, length = 300)
    private String legalName;

    @NotBlank
    @Column(name = "short_name", nullable = false, length = 100)
    private String shortName;

    @Column(name = "lei_code", length = 20)
    private String leiCode;

    @NotBlank
    @Size(min = 2, max = 2)
    @Column(name = "jurisdiction", nullable = false, length = 2)
    private String jurisdiction;

    @NotBlank
    @Column(name = "cp_type", nullable = false, length = 20)
    private String cpType;

    @Column(name = "credit_rating_id")
    private Long creditRatingId;

    @Column(name = "credit_limit", precision = 18, scale = 2)
    private BigDecimal creditLimit;

    @NotBlank
    @Size(min = 3, max = 3)
    @Column(name = "credit_limit_currency", nullable = false, length = 3)
    private String creditLimitCurrency;

    @Column(name = "credit_review_date")
    private LocalDate creditReviewDate;

    @Column(name = "settlement_days", nullable = false)
    private Integer settlementDays = 2;

    @Column(name = "default_currency_id")
    private Long defaultCurrencyId;

    @Column(name = "is_intercompany", nullable = false)
    private Boolean isIntercompany = false;

    @Column(name = "internal_entity_id")
    private Long internalEntityId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @NotBlank
    @Column(name = "kyc_status", nullable = false, length = 20)
    private String kycStatus;

    @Column(name = "kyc_approved_date")
    private LocalDate kycApprovedDate;

    @Column(name = "kyc_expiry_date")
    private LocalDate kycExpiryDate;

    @Column(name = "onboarded_date")
    private LocalDate onboardedDate;

    @Column(name = "deactivated_date")
    private LocalDate deactivatedDate;

    @Column(name = "notes", length = 1000)
    private String notes;
}
