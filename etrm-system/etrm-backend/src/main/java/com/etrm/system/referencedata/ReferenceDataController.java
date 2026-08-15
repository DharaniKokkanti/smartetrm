package com.etrm.system.referencedata;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.lookup.LookupResolutionService;
import com.etrm.system.lookup.LookupValue;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
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
    private final LookupResolutionService lookupResolutionService;

    public ReferenceDataController(
            MasterDataTableRegistryRepository registryRepository,
            ReferenceDataMetadataService metadataService,
            ReferenceDataCrudService crudService,
            LookupResolutionService lookupResolutionService
    ) {
        this.registryRepository = registryRepository;
        this.metadataService = metadataService;
        this.crudService = crudService;
        this.lookupResolutionService = lookupResolutionService;
    }

    private MasterDataTableRegistry requireRegistered(String tableName) {
        return registryRepository.findByTableNameIgnoreCaseAndIsEnabledTrue(tableName)
                .orElseThrow(() -> new NotFoundException(
                        "\"" + tableName + "\" is not a registered Tier 2 table."));
    }

    // V157 locked 51 tables SYSTEM-only (allow_create/edit/delete=0) so a
    // regular master-data editor can't touch ISO codes / internal enum
    // vocabulary / externally-standardized registries through the generic
    // screen. That lock was unconditional — not even the system ADMIN role
    // could override it, which is a real gap once you actually need to add
    // a value SYSTEM hasn't seeded yet (found via a GUI review: Legal Entity
    // Types, one of the 51, has no way to add e.g. a new legal form even for
    // the admin account). ADMIN's ROLE_ADMIN authority (UserPermissionService)
    // is checked here as an explicit, audited override — the row is still
    // written by createRow/updateRow/deleteRow's normal path (createdBy/
    // updatedBy still records the real admin user), it just isn't blocked by
    // the registry flag for this one role.
    //
    // 2026-08-15 correction: ROLE_ADMIN is a role a client's own top-level
    // user can hold — it does not distinguish "the vendor" from "a client's
    // own admin." The mst_ naming convention's whole point is "vendor-only,
    // not even a client super admin" (see MASTER_DATA_ARCHITECTURE.md §8),
    // so the override above must not apply to mst_-prefixed tables — those
    // stay hard-locked for every role until a real vendor-only flag exists,
    // distinct from ROLE_ADMIN. Left unchanged for every other prefix (ref_/
    // tran_/usr_/sys_), where the override was a deliberate, reasoned fix
    // for a real gap, not a hole.
    private boolean isSystemAdmin(Authentication authentication, String tableName) {
        if (tableName != null && tableName.startsWith("mst_")) return false;
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    @GetMapping
    public List<MasterDataTableRegistry> listTables() {
        return registryRepository.findByIsEnabledTrue();
    }

    // Dropdown source for fields whose real backing is a lookup_value
    // category rather than its own dedicated Tier 2 table (e.g. gl_account's
    // account_type — a real INT FK to lookup_value, per GlAccount.java's own
    // doc comment — never had a table of its own by design, see V84's
    // migration comment). Mapped before "/{table}" below so this literal
    // path wins over that path-variable route for the exact string
    // "lookup-values" (Spring ranks literal segments above {variable}
    // segments regardless of declaration order, but keeping the literal
    // mapping textually first avoids ever having to rely on that).
    // Returns the same {typeCode, typeName} shape every "_type" dedicated
    // table already returns, so existing frontend option-mapping code
    // (`r.typeCode`/`r.typeName`) needs no changes — only the fetch source
    // does.
    @GetMapping("/lookup-values")
    public List<Map<String, Object>> lookupValues(@RequestParam String category) {
        return lookupResolutionService.valuesForCategory(category).stream()
                .sorted(Comparator.comparing(LookupValue::getCode))
                .map(v -> Map.<String, Object>of(
                        "lookupId", v.getLookupId(),
                        "typeCode", v.getCode(),
                        "typeName", v.getDisplayName()
                ))
                .toList();
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
            @PathVariable String table, @RequestBody Map<String, Object> row, Authentication authentication
    ) {
        MasterDataTableRegistry entry = requireRegistered(table);
        if (!entry.getAllowCreate() && !isSystemAdmin(authentication, entry.getTableName())) {
            throw new IllegalStateException("Creating rows in \"" + table + "\" is not permitted.");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(crudService.createRow(entry.getTableName(), entry.getDisplayName(), row));
    }

    @PutMapping("/{table}/{id}")
    public Map<String, Object> updateRow(
            @PathVariable String table, @PathVariable Long id, @RequestBody Map<String, Object> row,
            Authentication authentication
    ) {
        MasterDataTableRegistry entry = requireRegistered(table);
        if (!entry.getAllowEdit() && !isSystemAdmin(authentication, entry.getTableName())) {
            throw new IllegalStateException("Editing rows in \"" + table + "\" is not permitted.");
        }
        return crudService.updateRow(entry.getTableName(), entry.getDisplayName(), id, row);
    }

    @DeleteMapping("/{table}/{id}")
    public ResponseEntity<Void> deleteRow(
            @PathVariable String table, @PathVariable Long id, Authentication authentication
    ) {
        MasterDataTableRegistry entry = requireRegistered(table);
        if (!entry.getAllowDelete() && !isSystemAdmin(authentication, entry.getTableName())) {
            throw new IllegalStateException("Deleting rows in \"" + table + "\" is not permitted.");
        }
        crudService.deleteRow(entry.getTableName(), entry.getDisplayName(), id);
        return ResponseEntity.noContent().build();
    }
}
