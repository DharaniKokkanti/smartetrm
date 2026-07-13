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

@Entity
@Table(name = "bank_account")
public class BankAccount extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bank_account_id")
    private Integer bankAccountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 20)
    private EntityType entityType;

    // entity_id is INT on bank_account (unlike address/contact, where it's
    // BIGINT) — matches the real column exactly, not a copy-paste of theirs.
    @Column(name = "entity_id", nullable = false)
    private Integer entityId;

    // account_type became an INT FK to dbo.bank_account_type (code-to-id
    // conversion sweep) — was VARCHAR(20) at this entity's original authoring.
    @Column(name = "account_type", nullable = false)
    private Integer accountType;

    @Column(name = "currency_id", nullable = false)
    private Integer currencyId;

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

    public Integer getBankAccountId() {
        return bankAccountId;
    }

    public void setBankAccountId(Integer bankAccountId) {
        this.bankAccountId = bankAccountId;
    }

    public EntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(EntityType entityType) {
        this.entityType = entityType;
    }

    public Integer getEntityId() {
        return entityId;
    }

    public void setEntityId(Integer entityId) {
        this.entityId = entityId;
    }

    public Integer getAccountType() {
        return accountType;
    }

    public void setAccountType(Integer accountType) {
        this.accountType = accountType;
    }

    public Integer getCurrencyId() {
        return currencyId;
    }

    public void setCurrencyId(Integer currencyId) {
        this.currencyId = currencyId;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(String bankCode) {
        this.bankCode = bankCode;
    }

    public String getSwiftBic() {
        return swiftBic;
    }

    public void setSwiftBic(String swiftBic) {
        this.swiftBic = swiftBic;
    }

    public String getIban() {
        return iban;
    }

    public void setIban(String iban) {
        this.iban = iban;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getCorrespondentSwift() {
        return correspondentSwift;
    }

    public void setCorrespondentSwift(String correspondentSwift) {
        this.correspondentSwift = correspondentSwift;
    }

    public String getCorrespondentName() {
        return correspondentName;
    }

    public void setCorrespondentName(String correspondentName) {
        this.correspondentName = correspondentName;
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
