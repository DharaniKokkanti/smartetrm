package com.etrm.system.commodityinstrumentmap;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class CommodityInstrumentMapKey implements Serializable {

    @Column(name = "commodity_type", nullable = false, length = 20)
    private String commodityType;

    @Column(name = "instrument_type", nullable = false, length = 30)
    private String instrumentType;

    public String getCommodityType() {
        return commodityType;
    }

    public String getInstrumentType() {
        return instrumentType;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CommodityInstrumentMapKey that)) return false;
        return Objects.equals(commodityType, that.commodityType) && Objects.equals(instrumentType, that.instrumentType);
    }

    @Override
    public int hashCode() {
        return Objects.hash(commodityType, instrumentType);
    }
}
