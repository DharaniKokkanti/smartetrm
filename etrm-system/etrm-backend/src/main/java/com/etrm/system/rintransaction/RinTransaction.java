package com.etrm.system.rintransaction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.rin_transaction — no PUT endpoint (frontend api.ts only has
 * list/create/void). transaction_type is an int FK into dbo.lookup_value,
 * category 'RIN_TRANSACTION_TYPE' (LookupResolutionService). status is a
 * separate PLAIN nvarchar column (PENDING/SUBMITTED/CONFIRMED/VOID), not an
 * FK — void() sets it directly. d_code joins rin_fuel_category by natural
 * key. total_value is a SQL Server computed column
 * (quantity * price_per_rin) — read-only.
 */
@Entity
@Table(name = "rin_transaction")
public class RinTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Integer transactionId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    // No @NotNull — client only sends the denormalized code (see @JsonIgnore
    // below); this raw FK id is populated by resolveForeignKeys() AFTER Bean
    // Validation runs, so @NotNull here would reject every real request.
    @Column(name = "transaction_type", nullable = false)
    private Integer transactionType;

    @Transient
    private String transactionTypeCode;

    @NotNull
    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @NotNull
    @Column(name = "account_id", nullable = false)
    private Integer accountId;

    @Transient
    @JsonProperty
    private String accountName;

    // dbo.rin_fuel_category.d_code is NVARCHAR(5) — max_length is in bytes
    // for NVARCHAR, so the real char limit is 5, not 10.
    @NotBlank
    @Size(max = 5)
    @Column(name = "d_code", nullable = false, length = 5)
    private String dCode;

    @Transient
    @JsonProperty
    private String fuelName;

    @NotNull
    @Column(name = "vintage_year", nullable = false)
    private Short vintageYear;

    @NotNull
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "price_per_rin", precision = 10, scale = 6)
    private BigDecimal pricePerRin;

    /** SQL Server computed column (quantity * price_per_rin) — read-only. */
    @Column(name = "total_value", precision = 29, scale = 8, insertable = false, updatable = false)
    private BigDecimal totalValue;

    @Column(name = "counterparty_id")
    private Integer counterpartyId;

    @Transient
    @JsonProperty
    private String counterpartyName;

    @Size(max = 200)
    @Column(name = "trade_reference", length = 200)
    private String tradeReference;

    @Size(max = 200)
    @Column(name = "batch_number", length = 200)
    private String batchNumber;

    @Size(max = 100)
    @Column(name = "epa_transaction_id", length = 100)
    private String epaTransactionId;

    @Column(name = "obligation_id")
    private Integer obligationId;

    @Column(name = "notes", columnDefinition = "nvarchar(max)")
    private String notes;

    @NotBlank
    @Size(max = 40)
    @Column(name = "status", nullable = false, length = 40)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Integer getTransactionId() {
        return transactionId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public void setTransactionId(Integer transactionId) {
        this.transactionId = transactionId;
    }

    @JsonIgnore
    public Integer getTransactionType() {
        return transactionType;
    }

    @JsonIgnore
    public void setTransactionType(Integer transactionType) {
        this.transactionType = transactionType;
    }

    @JsonProperty("transactionType")
    public String getTransactionTypeCode() {
        return transactionTypeCode;
    }

    @JsonProperty("transactionType")
    public void setTransactionTypeCode(String transactionTypeCode) {
        this.transactionTypeCode = transactionTypeCode;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDate transactionDate) {
        this.transactionDate = transactionDate;
    }

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    @JsonProperty("dCode")
    public String getDCode() {
        return dCode;
    }

    @JsonProperty("dCode")
    public void setDCode(String dCode) {
        this.dCode = dCode;
    }

    public String getFuelName() {
        return fuelName;
    }

    public void setFuelName(String fuelName) {
        this.fuelName = fuelName;
    }

    public Short getVintageYear() {
        return vintageYear;
    }

    public void setVintageYear(Short vintageYear) {
        this.vintageYear = vintageYear;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPricePerRin() {
        return pricePerRin;
    }

    public void setPricePerRin(BigDecimal pricePerRin) {
        this.pricePerRin = pricePerRin;
    }

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }

    public Integer getCounterpartyId() {
        return counterpartyId;
    }

    public void setCounterpartyId(Integer counterpartyId) {
        this.counterpartyId = counterpartyId;
    }

    public String getCounterpartyName() {
        return counterpartyName;
    }

    public void setCounterpartyName(String counterpartyName) {
        this.counterpartyName = counterpartyName;
    }

    public String getTradeReference() {
        return tradeReference;
    }

    public void setTradeReference(String tradeReference) {
        this.tradeReference = tradeReference;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public String getEpaTransactionId() {
        return epaTransactionId;
    }

    public void setEpaTransactionId(String epaTransactionId) {
        this.epaTransactionId = epaTransactionId;
    }

    public Integer getObligationId() {
        return obligationId;
    }

    public void setObligationId(Integer obligationId) {
        this.obligationId = obligationId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
