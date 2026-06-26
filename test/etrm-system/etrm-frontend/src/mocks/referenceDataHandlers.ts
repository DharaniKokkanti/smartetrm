import { http, HttpResponse } from 'msw';
import { registrySeed, metadataSeed, rowSeed } from './referenceData';
import type { ReferenceDataRow } from '@models/referenceData';

const API = '/api/v1';

// Deep-clone the seeds into a mutable per-table store, same pattern as the
// other mock handlers — this is a mock, not a database.
const stores: Record<string, ReferenceDataRow[]> = Object.fromEntries(
  Object.entries(rowSeed).map(([table, rows]) => [table, rows.map((r) => ({ ...r }))]),
);
const nextIdByTable: Record<string, number> = Object.fromEntries(
  Object.entries(rowSeed).map(([table, rows]) => [table, rows.length + 1]),
);

function problem(status: number, title: string, detail: string) {
  return HttpResponse.json({ type: 'about:blank', title, status, detail }, { status });
}

export const referenceDataHandlers = [
  http.get(`${API}/reference-data`, () => HttpResponse.json(registrySeed)),

  http.get(`${API}/reference-data/:table/metadata`, ({ params }) => {
    const meta = metadataSeed[params.table as string];
    if (!meta)
      return problem(404, 'Not Found', `No metadata registered for table "${params.table}".`);
    return HttpResponse.json(meta);
  }),

  http.get(`${API}/reference-data/:table`, ({ params }) => {
    const table = params.table as string;
    return HttpResponse.json(stores[table] ?? []);
  }),

  http.post(`${API}/reference-data/:table`, async ({ params, request }) => {
    const table = params.table as string;
    const meta = metadataSeed[table];
    if (!meta) return problem(404, 'Not Found', `No metadata registered for table "${table}".`);
    const body = (await request.json()) as ReferenceDataRow;
    const id = nextIdByTable[table] ?? 1;
    nextIdByTable[table] = id + 1;
    const row: ReferenceDataRow = { ...body, [meta.primaryKeyColumn]: id, isActive: true };
    stores[table] = [...(stores[table] ?? []), row];
    return HttpResponse.json(row, { status: 201 });
  }),

  http.put(`${API}/reference-data/:table/:id`, async ({ params, request }) => {
    const table = params.table as string;
    const meta = metadataSeed[table];
    if (!meta) return problem(404, 'Not Found', `No metadata registered for table "${table}".`);
    const id = Number(params.id);
    const idx = (stores[table] ?? []).findIndex((r) => r[meta.primaryKeyColumn] === id);
    if (idx === -1) return problem(404, 'Not Found', `No row with id ${id} in "${table}".`);
    const body = (await request.json()) as ReferenceDataRow;
    stores[table][idx] = { ...stores[table][idx], ...body };
    return HttpResponse.json(stores[table][idx]);
  }),

  http.delete(`${API}/reference-data/:table/:id`, ({ params }) => {
    const table = params.table as string;
    const meta = metadataSeed[table];
    if (!meta) return problem(404, 'Not Found', `No metadata registered for table "${table}".`);
    const id = Number(params.id);
    const before = (stores[table] ?? []).length;
    stores[table] = (stores[table] ?? []).filter((r) => r[meta.primaryKeyColumn] !== id);
    if (stores[table].length === before)
      return problem(404, 'Not Found', `No row with id ${id} in "${table}".`);
    return new HttpResponse(null, { status: 204 });
  }),
];
