package com.etrm.system.referencedata;

import java.util.List;

public record TableMetadata(
        String tableName,
        String displayName,
        String primaryKeyColumn,
        boolean isTemporal,
        List<ColumnMetadata> columns
) {}
