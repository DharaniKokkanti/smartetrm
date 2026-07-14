package com.etrm.system.lookup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Read path only — dbo.commodity_type is already fully editable via the
 * generic Tier 2 mechanism (registered in master_data_table_registry).
 * V85 pulled this OUT of the generic lookup_value/category system into its
 * own dedicated table and redirected desk.commodity_type/book.commodity_type
 * (and 9 other tables) onto it — do not confuse with LookupValue, which is
 * a different mechanism entirely (V85's own migration comment: "'book_type'
 * and 'commodity_type' are never picked up as lookup_categories at all").
 */
@Entity
@Table(name = "commodity_type")
public class CommodityType {

    @Id
    @Column(name = "commodity_type_id")
    private Integer commodityTypeId;

    @Column(name = "type_code", nullable = false, length = 50)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;

    public Integer getCommodityTypeId() {
        return commodityTypeId;
    }

    public String getTypeCode() {
        return typeCode;
    }

    public String getTypeName() {
        return typeName;
    }
}
