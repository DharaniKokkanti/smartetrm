package com.etrm.system.creditlimit;

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
 * Read-only event history for a credit_limit — system-generated (threshold
 * crossings, breaches, review-due notices), not created via the credit
 * limit form (frontend's CreditLimitInput explicitly omits 'alerts').
 */
@Entity
@Table(name = "credit_limit_alert")
public class CreditLimitAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Integer alertId;

    @NotNull
    @Column(name = "credit_limit_id", nullable = false)
    private Integer creditLimitId;

    @NotBlank
    @Column(name = "alert_type", nullable = false, length = 25)
    private String alertType;

    @NotBlank
    @Column(name = "recipients", nullable = false, length = 15)
    private String recipients;

    @NotBlank
    @Size(max = 500)
    @Column(name = "message", nullable = false, length = 500)
    private String message;

    @NotNull
    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Size(max = 100)
    @Column(name = "acknowledged_by", length = 100)
    private String acknowledgedBy;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    public Integer getAlertId() {
        return alertId;
    }

    public void setAlertId(Integer alertId) {
        this.alertId = alertId;
    }

    public Integer getCreditLimitId() {
        return creditLimitId;
    }

    public void setCreditLimitId(Integer creditLimitId) {
        this.creditLimitId = creditLimitId;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getRecipients() {
        return recipients;
    }

    public void setRecipients(String recipients) {
        this.recipients = recipients;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public String getAcknowledgedBy() {
        return acknowledgedBy;
    }

    public void setAcknowledgedBy(String acknowledgedBy) {
        this.acknowledgedBy = acknowledgedBy;
    }

    public LocalDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }
}
