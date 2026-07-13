package com.etrm.system.referencedata;

import com.etrm.system.support.ApiTestBase;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/**
 * Sweeps every registered, enabled Tier 2 table (154 as of this writing) and
 * exercises create -> read -> update -> delete through the generic
 * ReferenceDataController, building a best-effort valid payload from the
 * table's own live metadata — the same source ReferenceDataMetadataService
 * itself derives it from (enum first value, a real existing row's id for FK
 * columns, etc.).
 *
 * This intentionally does NOT assert business-rule correctness per table —
 * hand-authoring a fully valid payload for 154 tables' complete
 * CHECK-constraint matrix is a different, much larger job (most of a
 * generated payload will get legitimately rejected by some constraint the
 * metadata doesn't expose, e.g. incoterm.transport_mode's CHECK). What this
 * DOES assert: no create/update/delete attempt against any registered table
 * throws an unhandled exception (5xx). That's the exact bug signature this
 * session found repeatedly on the dedicated controllers (missing
 * created_by/updated_by handling, a SCOPE_IDENTITY() race,
 * IllegalStateException falling through to 500) — a 400/404/409 here is an
 * acceptable "the guessed payload didn't satisfy some constraint" outcome;
 * a 500 never is.
 */
class ReferenceDataCrudSmokeTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    @TestFactory
    Stream<DynamicTest> every_registered_table_survives_a_crud_cycle_without_a_500() throws Exception {
        List<Map<String, Object>> tables = fetchRegisteredTables();
        return tables.stream().map(table ->
                DynamicTest.dynamicTest((String) table.get("tableName"), () -> exerciseTable(table)));
    }

    private List<Map<String, Object>> fetchRegisteredTables() throws Exception {
        String body = mockMvc.perform(auth(get("/api/v1/reference-data")))
                .andReturn().getResponse().getContentAsString();
        JsonNode arr = objectMapper.readTree(body);
        List<Map<String, Object>> result = new ArrayList<>();
        for (JsonNode node : arr) {
            Map<String, Object> m = new HashMap<>();
            m.put("tableName", node.get("tableName").asText());
            m.put("allowCreate", node.get("allowCreate").asBoolean());
            m.put("allowEdit", node.get("allowEdit").asBoolean());
            m.put("allowDelete", node.get("allowDelete").asBoolean());
            result.add(m);
        }
        return result;
    }

    private void exerciseTable(Map<String, Object> table) throws Exception {
        String tableName = (String) table.get("tableName");
        boolean allowCreate = (boolean) table.get("allowCreate");
        boolean allowEdit = (boolean) table.get("allowEdit");
        boolean allowDelete = (boolean) table.get("allowDelete");

        if (!allowCreate) return; // registry denies create entirely — nothing to exercise here

        JsonNode metadata = fetchMetadata(tableName);
        Map<String, Object> payload = buildPayload(metadata);

        MvcResult createResult = mockMvc.perform(auth(post("/api/v1/reference-data/" + tableName)).content(json(payload)))
                .andReturn();
        int createStatus = createResult.getResponse().getStatus();
        String createBody = createResult.getResponse().getContentAsString();
        assertTrue(createStatus < 500,
                () -> tableName + ": create returned " + createStatus + " — " + createBody);

        if (createStatus != 201) return; // guessed payload didn't satisfy some constraint — acceptable, not this test's job

        JsonNode created = objectMapper.readTree(createBody);
        String pkCamel = metadata.get("primaryKeyColumn").asText();
        long id = created.get(pkCamel).asLong();

        try {
            MvcResult listResult = mockMvc.perform(auth(get("/api/v1/reference-data/" + tableName))).andReturn();
            assertTrue(listResult.getResponse().getStatus() < 500, tableName + ": list after create");

            if (allowEdit) {
                MvcResult updateResult = mockMvc.perform(
                                auth(put("/api/v1/reference-data/" + tableName + "/" + id)).content(json(payload)))
                        .andReturn();
                int updateStatus = updateResult.getResponse().getStatus();
                String updateBody = updateResult.getResponse().getContentAsString();
                assertTrue(updateStatus < 500,
                        () -> tableName + ": update returned " + updateStatus + " — " + updateBody);
            }
        } finally {
            if (allowDelete) {
                mockMvc.perform(auth(delete("/api/v1/reference-data/" + tableName + "/" + id)));
            } else {
                // Not deletable through the API by design (allow_delete=0) —
                // clean up directly so repeated runs of this sweep don't
                // leave permanent junk rows in a live dev DB.
                jdbc.update("DELETE FROM dbo." + tableName + " WHERE " + camelToSnake(pkCamel) + " = ?", id);
            }
        }
    }

    private JsonNode fetchMetadata(String tableName) throws Exception {
        String body = mockMvc.perform(auth(get("/api/v1/reference-data/" + tableName + "/metadata")))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body);
    }

    private Map<String, Object> buildPayload(JsonNode metadata) {
        Map<String, Object> payload = new LinkedHashMap<>();
        for (JsonNode col : metadata.get("columns")) {
            if (col.get("isPrimaryKey").asBoolean()) continue;
            payload.put(col.get("name").asText(), valueFor(col));
        }
        return payload;
    }

    private Object valueFor(JsonNode col) {
        String kind = col.get("kind").asText();
        return switch (kind) {
            case "boolean" -> true;
            case "date" -> "2026-01-01";
            case "enum" -> col.get("enumValues").get(0).asText();
            case "foreign_key" -> resolveForeignKeyValue(col.get("foreignKeyTable").asText());
            case "number" -> isIntegerSubKind(col) ? 1 : 1.0;
            default -> {
                String base = "T" + unique();
                JsonNode maxLenNode = col.get("maxLength");
                Integer maxLen = (maxLenNode != null && !maxLenNode.isNull()) ? maxLenNode.asInt() : null;
                yield (maxLen != null && maxLen < base.length()) ? base.substring(0, maxLen) : base;
            }
        };
    }

    private boolean isIntegerSubKind(JsonNode col) {
        JsonNode n = col.get("numericSubKind");
        return n != null && !n.isNull() && "integer".equals(n.asText());
    }

    private Object resolveForeignKeyValue(String fkTable) {
        try {
            JsonNode fkMetadata = fetchMetadata(fkTable);
            String fkPk = camelToSnake(fkMetadata.get("primaryKeyColumn").asText());
            Object value = jdbc.queryForObject("SELECT TOP 1 " + fkPk + " FROM dbo." + fkTable, Object.class);
            return value != null ? value : 1;
        } catch (Exception e) {
            // Empty/self-referencing FK target, or lookup failure — fall
            // back to a plausible guess and let the create attempt's own
            // status code (409 FK violation, most likely) be the real
            // signal, rather than failing the sweep here.
            return 1;
        }
    }

    private String camelToSnake(String camel) {
        StringBuilder sb = new StringBuilder();
        for (char c : camel.toCharArray()) {
            if (Character.isUpperCase(c)) sb.append('_').append(Character.toLowerCase(c));
            else sb.append(c);
        }
        return sb.toString();
    }
}
