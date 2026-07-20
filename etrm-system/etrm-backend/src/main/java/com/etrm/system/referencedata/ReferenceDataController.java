package com.etrm.system.referencedata;

import com.etrm.system.common.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/tier2/api.ts. Every {table} path variable is
 * resolved against master_data_table_registry FIRST — an unregistered or
 * disabled table name 404s before any SQL is built, which is what keeps the
 * generic CRUD service in ReferenceDataCrudService safe to build dynamic
 * SQL from.
 */
@RestController
@RequestMapping("/api/v1/reference-data")
public class ReferenceDataController {

    private final MasterDataTableRegistryRepository registryRepository;
    private final ReferenceDataMetadataService metadataService;
    private final ReferenceDataCrudService crudService;

    public ReferenceDataController(
            MasterDataTableRegistryRepository registryRepository,
            ReferenceDataMetadataService metadataService,
            ReferenceDataCrudService crudService
    ) {
        this.registryRepository = registryRepository;
        this.metadataService = metadataService;
        this.crudService = crudService;
    }

    private MasterDataTableRegistry requireRegistered(String tableName) {
        return registryRepository.findByTableNameIgnoreCaseAndIsEnabledTrue(tableName)
                .orElseThrow(() -> new NotFoundException(
                        "\"" + tableName + "\" is not a registered Tier 2 table."));
    }

    @GetMapping
    public List<MasterDataTableRegistry> listTables() {
        return registryRepository.findByIsEnabledTrue();
    }

    @GetMapping("/{table}/metadata")
    public TableMetadata getMetadata(@PathVariable String table) {
        MasterDataTableRegistry entry = requireRegistered(table);
        return metadataService.getMetadata(entry.getTableName(), entry.getDisplayName());
    }

    // page/size are opt-in — omitting both keeps the exact pre-existing
    // unpaginated response shape (a bare array), so no existing caller is
    // affected. Passing either returns a paginated envelope instead.
    @GetMapping("/{table}")
    public Object listRows(
            @PathVariable String table,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        MasterDataTableRegistry entry = requireRegistered(table);
        if (page == null && size == null) {
            return crudService.listRows(entry.getTableName());
        }
        return crudService.listRowsPaged(
                entry.getTableName(), entry.getDisplayName(),
                page == null ? 0 : page, size == null ? 50 : size);
    }

    @PostMapping("/{table}")
    public ResponseEntity<Map<String, Object>> createRow(
            @PathVariable String table, @RequestBody Map<String, Object> row
    ) {
        MasterDataTableRegistry entry = requireRegistered(table);
        if (!entry.getAllowCreate()) {
            throw new IllegalStateException("Creating rows in \"" + table + "\" is not permitted.");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(crudService.createRow(entry.getTableName(), entry.getDisplayName(), row));
    }

    @PutMapping("/{table}/{id}")
    public Map<String, Object> updateRow(
            @PathVariable String table, @PathVariable Long id, @RequestBody Map<String, Object> row
    ) {
        MasterDataTableRegistry entry = requireRegistered(table);
        if (!entry.getAllowEdit()) {
            throw new IllegalStateException("Editing rows in \"" + table + "\" is not permitted.");
        }
        return crudService.updateRow(entry.getTableName(), entry.getDisplayName(), id, row);
    }

    @DeleteMapping("/{table}/{id}")
    public ResponseEntity<Void> deleteRow(@PathVariable String table, @PathVariable Long id) {
        MasterDataTableRegistry entry = requireRegistered(table);
        if (!entry.getAllowDelete()) {
            throw new IllegalStateException("Deleting rows in \"" + table + "\" is not permitted.");
        }
        crudService.deleteRow(entry.getTableName(), entry.getDisplayName(), id);
        return ResponseEntity.noContent().build();
    }
}
