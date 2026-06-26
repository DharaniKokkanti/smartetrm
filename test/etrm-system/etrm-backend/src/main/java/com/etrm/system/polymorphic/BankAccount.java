package com.etrm.system.polymorphic;

import com.etrm.system.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "bank_account")
public class BankAccount extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bank_account_id")
    private Long bankAccountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 20)
    private EntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "account_type", nullable = false, length = 20)
    private String accountType;

    @Column(name = "currency_id", nullable = false)
    private Long currencyId;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @NotBlank
    @Column(name = "bank_name", nullable = false, length = 200)
    private String bankName;

    @Column(name = "bank_code", length = 30)
    private String bankCode;

    @Column(name = "swift_bic", length = 11)
    private String swiftBic;

    @Column(name = "iban", length = 34)
    private String iban;

    @Column(name = "account_number", length = 50)
    private String accountNumber;

    @NotBlank
    @Column(name = "account_name", nullable = false, length = 200)
    private String accountName;

    @Column(name = "correspondent_swift", length = 11)
    private String correspondentSwift;

    @Column(name = "correspondent_name", length = 200)
    private String correspondentName;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "notes", length = 500)
    private String notes;
}
