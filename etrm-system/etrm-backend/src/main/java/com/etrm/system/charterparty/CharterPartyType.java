package com.etrm.system.charterparty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.charter_party_type is served generically via the Tier2 reference-data
 * mechanism (no dedicated controller) — this is a minimal read-only reader
 * so CharterPartyService can resolve charter_party_type_id -> its code/name
 * for display, same pattern as batch 3's CreditTerm/PaymentTerm readers.
 */
@Entity
@Table(name = "charter_party_type")
public class CharterPartyType {

    @Id
    @Column(name = "charter_party_type_id")
    private Integer charterPartyTypeId;

    @Column(name = "type_code", nullable = false, length = 20)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;

    public Integer getCharterPartyTypeId() {
        return charterPartyTypeId;
    }

    public String getTypeCode() {
        return typeCode;
    }

    public String getTypeName() {
        return typeName;
    }
}
