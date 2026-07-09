package com.etrm.system.referencedata;

import java.util.List;

public record ColumnMetadata(
        String name,
        String label,
        String kind,            // 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'foreign_key'
        boolean isPrimaryKey,
        boolean nullable,
        Integer maxLength,
        List<String> enumValues,
        String foreignKeyTable,
        String numericSubKind   // 'integer' | 'decimal' | null — only set when kind == 'number'
) {}
