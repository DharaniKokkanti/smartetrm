package com.etrm.system.lookup;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Resolves lookup_value rows by category code + code (e.g. category
 * 'commodity_type', code 'OIL') to/from the numeric lookup_id every FK
 * column that points at lookup_value actually stores. Category id is looked
 * up fresh each call rather than cached — this mirrors every other generic
 * lookup in the app (no premature caching layer) and categories are read
 * maybe once per request, not in a hot loop.
 */
@Service
public class LookupResolutionService {

    private final LookupCategoryRepository categoryRepository;
    private final LookupValueRepository valueRepository;

    public LookupResolutionService(LookupCategoryRepository categoryRepository, LookupValueRepository valueRepository) {
        this.categoryRepository = categoryRepository;
        this.valueRepository = valueRepository;
    }

    private Integer categoryId(String categoryCode) {
        return categoryRepository.findByCategoryCodeIgnoreCase(categoryCode)
                .orElseThrow(() -> new NotFoundException("No lookup category \"" + categoryCode + "\"."))
                .getCategoryId();
    }

    public List<LookupValue> valuesForCategory(String categoryCode) {
        return valueRepository.findByCategoryId(categoryId(categoryCode));
    }

    /** code (e.g. "OIL") -> lookup_id, scoped to one category. */
    public Integer idForCode(String categoryCode, String code) {
        return valuesForCategory(categoryCode).stream()
                .filter(v -> v.getCode().equalsIgnoreCase(code))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("No lookup value \"" + code + "\" in category \"" + categoryCode + "\"."))
                .getLookupId();
    }

    /** lookup_id -> code (e.g. "OIL"), scoped to one category. */
    public String codeForId(String categoryCode, Integer lookupId) {
        return valuesForCategory(categoryCode).stream()
                .filter(v -> v.getLookupId().equals(lookupId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("No lookup value with id " + lookupId + " in category \"" + categoryCode + "\"."))
                .getCode();
    }

    /** Whole-category code<->id maps, for bulk CSV<->id-list translation (trader.commodityTypes). */
    public Map<String, Integer> codeToIdMap(String categoryCode) {
        return valuesForCategory(categoryCode).stream()
                .collect(Collectors.toMap(LookupValue::getCode, LookupValue::getLookupId, (a, b) -> a));
    }

    public Map<Integer, String> idToCodeMap(String categoryCode) {
        return valuesForCategory(categoryCode).stream()
                .collect(Collectors.toMap(LookupValue::getLookupId, LookupValue::getCode, (a, b) -> a));
    }
}
