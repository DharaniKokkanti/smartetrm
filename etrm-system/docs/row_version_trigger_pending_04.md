# Pending Project — `row_version` bypass-write gap (trigger-enforced auto-increment)

> **Persona for this doc:** You are an ETRM master-data governance / concurrency-control expert — apply that expertise when closing the gap below the same way the row_version and audit-column rollouts (V127-V151) were closed.

**Status: PLANNED, NOT STARTED.** Design decided and documented 2026-07-22
(this doc). Waiting on explicit user go-ahead before writing any migration
or trigger DDL — see handoff doc §0 2026-07-22 entry.

## The gap

Every governed table's `row_version INT NOT NULL DEFAULT 0` is bumped
**only by application code** — either Hibernate's `@Version` merge-time
check (dedicated entities) or the Tier2 generic engine's explicit
version-check-and-increment (`ReferenceDataCrudService`, for the ~150
Tier2-registered tables). Neither is triggered by a write that bypasses
the Java service layer entirely: a direct `UPDATE` via SSMS, a PDI/Airflow
job, or any future ETL/batch process against these tables leaves
`row_version` untouched even though the row's data changed.

**Concrete failure this causes**: a user has a record open (read at
`row_version=5`). A direct-SQL/PDI write changes the row but doesn't bump
`row_version` — it's still `5`. The user saves through the UI; Hibernate's
`WHERE row_version = 5` still matches, so the save succeeds and silently
overwrites the direct-SQL change with the user's (now-stale) form data. No
conflict is raised anywhere — this is exactly the class of lost-update bug
`@Version` optimistic locking exists to prevent, and it only works if every
writer participates.

This is the same root concern already flagged as an open item in the
project's architecture-plan doc (`CLAUDE.md` §2, "JPA-session-based diffing
misses writes from PDI/Airflow/direct SQL that bypass the Java layer
entirely") — surfaced there for the *planned* event-outbox layer, but it's
actually a live gap in the *already-built* optimistic-locking system today,
independent of whether the event-architecture layer ever gets built.

## Options considered, and why native SQL Server `ROWVERSION`/`TIMESTAMP` was rejected

The obvious fix that closes this gap completely is to convert `row_version`
from a plain `INT` to SQL Server's native `ROWVERSION`/`TIMESTAMP` binary
type, since the database engine itself bumps that value on **any** write to
the row, regardless of who issued it — no application discipline required.
Rejected for now, for concrete reasons (not just "more familiar with INT"):

1. **Hard-incompatible with system-versioned temporal tables.** SQL Server
   does not allow a `rowversion`/`timestamp`-typed column on a
   system-versioned temporal table, and `legal_entity`, `app_user`, `book`,
   `counterparty`, `pricing_rule`, `trade`, `trade_pricing_schedule` are all
   temporal (§5 "Temporal tables" in the handoff doc) — several of the very
   tables `row_version` already protects. A blanket type conversion isn't
   possible; it would have to be two different concurrency-token types
   depending on whether a given table happens to be temporal, which is its
   own maintenance burden.
2. **Client can no longer supply/default the value.** Today
   `INT NOT NULL DEFAULT 0` lets a new record start deterministic, and the
   frontend literally sends `rowVersion: existing?.rowVersion ?? 0` for new
   records (see e.g. `LegalEntityFormPage.tsx`). `rowversion` is always
   100% engine-generated on insert — this convention would need to change
   app-wide.
3. **Opaque binary on the wire.** Every DTO carrying `rowVersion` today
   ships a plain JSON number; `rowversion` is an 8-byte binary needing
   base64/hex encoding, and the frontend's `optimisticLock.tsx` conflict
   flow (currently a clean int compare) would need to switch to byte-array
   equality.
4. **One `rowversion`/`timestamp` column per table, hard SQL Server limit**
   — forecloses ever using it for a second engine-maintained purpose (e.g.
   Change Tracking metadata, relevant if the CDC-safety-net idea in
   `CLAUDE.md` §2 is ever pursued).
5. **Migration mechanics** — can't `ALTER COLUMN` in place; requires
   drop-and-recreate across every governed table (~217+ entities per the
   V127-V151 rollout), paired with an `Integer` → `byte[]` change in every
   corresponding Java entity, done consistently to avoid a half-migrated
   state.

## `INT` is not universal — sizing gets more important once triggers exist

Today, `row_version` growth is bounded by how often a human edits a row
through the UI — reaching `INT`'s ~2.147 billion cap is a non-concern in
practice. **This changes once the trigger rollout below ships**: a
trigger-enforced bump fires on *every* `UPDATE`, including ones from
high-frequency automated sources (batch/ETL, PDI, any future cascade
recalculation from the planned event-architecture layer in `CLAUDE.md`)
that never touched `row_version` before because they never went through
Hibernate. A table that's both (a) wired to the bump trigger and (b) hit by
a high-frequency automated writer could accumulate increments meaningfully
faster than the human-edit assumption `INT` was originally sized for.

**Rule, restated from the handoff doc's governance standing rule**: `INT`
stays the default for ordinary master data, but is not applied blindly —
get explicit confirmation from Dharani on `INT` vs `BIGINT` per table,
every time, stating the table's expected write frequency/source. This
applies doubly once this trigger rollout is live, since the trigger removes
the "a person has to click Save" throttle that made `INT` a safe default
in the first place.

## Decision: trigger-enforced `INT`, not a type change

Add a `AFTER UPDATE` trigger per governed table that unconditionally does
`SET row_version = row_version + 1` on the updated row(s) — this gets the
same engine-enforced guarantee (no writer, Java or otherwise, can forget to
bump it) without any of the five complications above: the column stays a
plain human-readable `INT`, no Java/TypeScript/DTO contract changes, no
temporal-table conflict, no migration of existing entity mappings.

Trade-off accepted: a trigger fires on *any* column change, including
trivial/non-business-significant ones — same coarse granularity the
current app-level `@Version` already has (Hibernate bumps on any dirty
save too), so this is not a regression, just not a finer-grained
"significant change only" bump. That refinement (if ever wanted) is the
same `meta_field_change_rule` significance concept `CLAUDE.md` §3 already
describes for the unrelated streaming-layer work — not part of this scope.

## Next steps when this gets picked up

1. Confirm the exact current list of tables carrying `row_version` via a
   direct `sys.columns` query (not a code-derived count — the same
   "verify with a real DB query" rule that caught the V136/V137 gaps
   applies here) — the V127-V151 history put the number at 217+ but it may
   have grown since.
2. Write one trigger template (`CREATE TRIGGER trg_<table>_row_version_bump
   ON dbo.<table> AFTER UPDATE AS ...`, guarded so it doesn't fire on the
   temporal history table or double-count when the app itself already
   incremented `row_version` in the same statement — needs a real check,
   not an assumption, since a naive trigger would double-increment on every
   application-initiated save too).
3. Batch the rollout the same way V144-V151 batched the 80-table governance
   sweep (parallel worktree agents, one migration file per batch) rather
   than one giant migration touching 200+ tables at once.
4. Live-verify per batch: apply migration, confirm a direct `UPDATE ...
   WHERE id = X` via `sqlcmd` bumps `row_version` by exactly 1, confirm a
   normal application save through Hibernate/the Tier2 engine still only
   bumps by 1 (not 2, from double-counting the trigger + the app-level
   increment) — this double-increment risk is the main thing that can go
   wrong and must be proven, not assumed, before rollout.
