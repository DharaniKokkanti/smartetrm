package com.etrm.system.currency;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * dbo.currency predates AuditableEntity (V1) and was never fully migrated
 * onto it — V98 added only created_at (what the frontend Currency type
 * actually uses), not created_by/updated_at/updated_by. Does not extend
 * AuditableEntity; createdAt is set once by CurrencyService on create and
 * never updated.
 */
@Entity
@Table(name = "currency")
public class Currency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "currency_id")
    private Integer currencyId;

    // currency_code is CHAR(3), not VARCHAR — same Hibernate mapping gotcha
    // as Country.countryCode (needs explicit columnDefinition or
    // ddl-auto=validate fails at boot).
    @NotBlank
    @Size(min = 3, max = 3)
    @Column(name = "currency_code", nullable = false, length = 3, columnDefinition = "char(3)")
    private String currencyCode;

    @NotBlank
    @Size(max = 100)
    @Column(name = "currency_name", nullable = false, length = 100)
    private String currencyName;

    @Size(max = 5)
    @Column(name = "symbol", length = 5)
    private String symbol;

    // country_id (FK dbo.country) — V98. Nullable: supranational currencies
    // (EUR) have no single owning country.
    @Column(name = "country_id")
    private Integer countryId;

    // TINYINT -> Short, not Integer (same Hibernate mapping rule as
    // Period.rollOffset/cropYearOffsetMonths).
    @NotNull
    @Column(name = "decimal_places", nullable = false)
    private Short decimalPlaces = 2;

    @NotNull
    @Column(name = "is_base_currency", nullable = false)
    private Boolean isBaseCurrency = false;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Integer getCurrencyId() {
        return currencyId;
    }

    public void setCurrencyId(Integer currencyId) {
        this.currencyId = currencyId;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public String getCurrencyName() {
        return currencyName;
    }

    public void setCurrencyName(String currencyName) {
        this.currencyName = currencyName;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public Integer getCountryId() {
        return countryId;
    }

    public void setCountryId(Integer countryId) {
        this.countryId = countryId;
    }

    public Short getDecimalPlaces() {
        return decimalPlaces;
    }

    public void setDecimalPlaces(Short decimalPlaces) {
        this.decimalPlaces = decimalPlaces;
    }

    public Boolean getIsBaseCurrency() {
        return isBaseCurrency;
    }

    public void setIsBaseCurrency(Boolean isBaseCurrency) {
        this.isBaseCurrency = isBaseCurrency;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
