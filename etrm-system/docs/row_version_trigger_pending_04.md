# Pending Project — `row_version` bypass-write gap (trigger-enforced auto-increment)

> **Persona for this doc:** You are an ETRM master-data governance / concurrency-control expert — apply that expertise when closing the gap below the same way the row_version and audit-column rollouts (V127-V151) were closed.

**Status: RESOLVED (2026-07-22/23, V152 superseded by V153).** V152 shipped
first with a "silently bump it for you" trigger design — implemented and
live-verified on 2026-07-22 (see the "V152 implementation record" section
below). The user then explicitly overrode that design on 2026-07-23:
instead of silently patching up a bypass write, the trigger should
**reject** it outright unless the writer correctly advances `row_version`
itself. `V153__row_version_guard_reject_bypass_writes.sql` dropped all 237
of V152's "bump" triggers still present (1 had already been dropped during
this session's own isolated testing) and replaced them with 238 stricter
"guard" triggers across the same table set. See the "V153 implementation
record" section below for the full design and verification of the
**current, final** behavior — the V152 section above it is kept only as a
historical record of the design that was superseded, not a description of
what's live today.

## Current behavior (V153, supersedes V152)

A trigger on every `row_version`-bearing table now **rejects** (raises an
error and rolls back the triggering transaction) any `UPDATE` that doesn't
correctly advance `row_version` itself:
1. The statement must include `row_version` in its own `SET` list — a
   write that doesn't touch it at all is rejected.
2. The new value must be strictly greater than the row's previous value —
   a write that sets it to the same value (no-op) or a lower/reused value
   is rejected too.

This applies with **no exceptions** — including future Flyway migrations
and seed/data-fix scripts, per explicit user instruction. See the "Standing
rule" this creates, recorded in the handoff doc's governance section.

## The gap

Every governed table's `row_version INT NOT NULL DEFAULT 0` is bumped
**only by application code** — either Hibernate's `@Version` merge-time
check (dedicated entities) or the Tier2 generic engine's explicit
version-check-and-increment (`ReferenceDataCrudService`, for the ~150
Tier2-registered tables). Neither is triggered by any write that bypasses
the Java service layer entirely — a direct `UPDATE` run via SSMS for a
manual data fix, or any future ETL/batch/integration process this
platform doesn't have yet — leaving `row_version` untouched even though
the row's data changed. (This system doesn't currently have any ETL/batch
integration writing to it. The gap matters regardless of what, if
anything, ever writes SQL here outside the Java layer; the trigger doesn't
check who wrote the SQL, only whether `row_version` was correctly
advanced.)

**Concrete failure this causes**: a user has a record open (read at
`row_version=5`). A direct-SQL write changes the row but doesn't bump
`row_version` — it's still `5`. The user saves through the UI; Hibernate's
`WHERE row_version = 5` still matches, so the save succeeds and silently
overwrites the direct-SQL change with the user's (now-stale) form data. No
conflict is raised anywhere — this is exactly the class of lost-update bug
`@Version` optimistic locking exists to prevent, and it only works if every
writer participates.

The gap this doc addresses is real independent of any specific external
tool: any raw SQL bypassing the Java layer breaks optimistic locking,
whether the writer is a person, a future integration, or nothing that
exists yet.

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
practice. **This changes if a table is ever written to by a high-frequency
automated source** (batch/ETL, any future cascade recalculation from the
planned event-architecture layer in `CLAUDE.md` — none of which exist in
this codebase yet) that correctly participates in the `row_version`
contract (required under V153's guard trigger — see below) but does so far
more often than a person clicking Save ever would. Note this is now about
*correctly incrementing* `row_version` at high frequency, not about the
trigger silently bumping it on your behalf — V153 (below) replaced that
earlier "auto-bump" design with a strict reject-if-you-don't-do-it-yourself
rule, so any high-frequency writer must already own its own increments the
same way Hibernate does. A table hit by a high-frequency automated writer
could still accumulate increments meaningfully faster than the human-edit
assumption `INT` was originally sized for — the trigger changed *who*
performs the increment, not whether high-frequency writers can burn
through `INT`'s range.

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

## V152 implementation record (2026-07-22) — superseded design, kept for history

Went with a single migration using dynamic SQL (a cursor over
`sys.tables`/`sys.columns` generating and executing one `CREATE TRIGGER`
per table via `sp_executesql`) rather than the batched-worktree-agent
approach used for V144-V151 — appropriate here because, unlike that
rollout, this required **zero Java/entity changes**, so there was no
per-table hand-editing risk to parallelize away; the whole thing is one
generic, idempotent SQL script (skips tables that already have the trigger
or lack a primary key), matching the spirit of the existing generic Tier2
engine rather than the per-entity governance-column pattern.

**Trigger shape actually shipped:**
```sql
CREATE TRIGGER dbo.trg_<table>_row_version_bump ON dbo.<table>
AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(row_version) RETURN;

    UPDATE t SET t.row_version = t.row_version + 1
    FROM dbo.<table> t
    INNER JOIN inserted i ON <every PK column, t = i>;
END;
```
Primary key columns are discovered per-table from `sys.indexes` (not a
hardcoded `id`/`<table>_id` assumption), so this also works correctly on a
composite-PK table if one is ever added to the governed set.

**Real bug caught by live boot, not by review**: the first version wrote
`SET row_version = row_version + 1` (unqualified). SQL Server rejected
every `CREATE TRIGGER` with `Ambiguous column name 'row_version'` — both
the trigger's own table alias `t` and the `inserted` pseudo-table have a
`row_version` column, so the bare reference didn't resolve. Confirmed zero
triggers had been created and no `flyway_schema_history` row was written
before fixing (SQL Server validates trigger bodies at `CREATE TRIGGER`
time, so it failed on the very first table, before any dynamic SQL calls
that could partially apply). Fixed to `SET t.row_version = t.row_version + 1`,
explicitly qualified.

**Live-verified, in order:**
1. **Isolated single-table test first** (`incoterm`, non-temporal), before
   touching the full 238-table set: a bypass write (`UPDATE ... SET name =
   name`, no `row_version` in the `SET` list) correctly bumped `0 → 1`. An
   app-simulated write (`SET name = name, row_version = row_version + 1`,
   mirroring exactly what Hibernate/`ReferenceDataCrudService` generate)
   went `1 → 2`, not `3` — confirmed no double-increment. Test trigger
   dropped and the row's `row_version` reset to `0` afterward.
2. **Full rollout via `mvn spring-boot:run`** (runs Flyway for real):
   `Successfully applied 1 migration to schema [dbo], now at version v152`,
   migration's own `PRINT` summary confirmed **238 triggers created, 0
   skipped-existing, 0 skipped-no-PK**. Backend booted clean — zero
   Hibernate `ddl-auto: validate` mismatches (this migration adds no
   columns, so none were expected, but boot success confirms nothing else
   broke).
3. **Confirmed the write-path proof isn't just simulated**: read
   `ReferenceDataCrudService.java:273` directly —
   `setClauses.add("row_version = row_version + 1")` — the real Tier2
   engine's generated SQL is exactly the shape tested in step 1. Hibernate's
   `@Version` merge does the equivalent for dedicated entities. Both real
   write paths always include `row_version` in their own `SET` clause, so
   `UPDATE(row_version)` is `TRUE` for every real application write and the
   trigger correctly no-ops for both.
4. **Temporal-table side effect confirmed exactly as predicted** in the
   migration's own comments: on `legal_entity` (system-versioned temporal),
   a bypass write (`UPDATE ... SET notes = notes`) went from 1 to 3 history
   rows for `legal_entity_id = 1` — the bypass write's own historization,
   plus a second one from the trigger's follow-up `UPDATE`. Confirmed via
   direct `dbo.legal_entity_history` query. This is the accepted cosmetic
   trade-off documented up front, not a new problem.
5. One tooling-only false alarm along the way: an initial `sqlcmd -Q`
   bypass-write test failed with `SET options have incorrect settings:
   'QUOTED_IDENTIFIER'` — a `sqlcmd` raw-batch session default, unrelated to
   the trigger; JDBC (what the real backend actually uses) always sets
   `QUOTED_IDENTIFIER ON` per connection, so this never affects real
   traffic. Confirmed by re-running the same test with `SET
   QUOTED_IDENTIFIER ON` first — worked immediately, bumped `row_version`
   `1 → 2` as expected.

Backend stopped after verification (wasn't running before this session
started it). No test data cleanup needed beyond the trigger drop in step 1
— the `legal_entity`/`incoterm` `row_version`/history mutations from live
testing are harmless (the counter has no semantic meaning beyond
"changed since I last read it," and the extra `legal_entity_history` rows
are an honest record of the real test write, not clutter to remove).

## V153 implementation record (2026-07-23) — current, live design

User explicitly overrode V152's "silently bump it" design after reviewing
it: a bypass write should be **rejected**, not silently patched up, and
this rule should apply with no exceptions — including future Flyway
migrations/seed scripts, not just external ETL. Confirmed via
`AskUserQuestion` before implementing, since this is a materially
different, higher-risk behavior change (rejecting writes vs. quietly
tracking them) than what V152 already had live and tested.

**Pre-flight check before writing anything**: grepped the whole backend for
`@Modifying` bulk JPQL/native update queries (zero found) and raw
`JdbcTemplate`/`.update()` UPDATE statements outside
`ReferenceDataCrudService` (zero found) — confirmed no other write path in
this codebase needed changes to stay compliant with a strict reject rule
before deploying it.

**Trigger shape shipped** (`V153__row_version_guard_reject_bypass_writes.sql`,
one idempotent migration, same dynamic-SQL-over-`sys.tables` approach as
V152): drops each table's old `trg_<table>_row_version_bump` if present,
creates `trg_<table>_row_version_guard`:
```sql
CREATE TRIGGER dbo.trg_<table>_row_version_guard ON dbo.<table>
AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.<table> (bypass write rejected by trg_<table>_row_version_guard)', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM inserted i INNER JOIN deleted d ON <every PK column, i = d>
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.<table> (stale or reused version rejected by trg_<table>_row_version_guard)', 16, 1);
        RETURN;
    END
END;
```
`ROLLBACK TRANSACTION` then `RAISERROR` then `RETURN` is the standard SQL
Server pattern for an `AFTER` trigger to reject the statement that fired
it — this rolls back the **entire** transaction the triggering statement
was part of, not just the one row, an inherent property of trigger-based
validation (proven directly in step 1 below, test 4).

**Live-verified, in order:**
1. **Isolated single-table test on `incoterm`** (dropped V152's bump
   trigger on it first, created a test-named guard trigger), 4 scenarios:
   (a) bypass write (no `row_version` in `SET`) → rejected, `row_version`
   unchanged. (b) write that explicitly sets `row_version` to a stale/reused
   value (same as current) → rejected, unchanged. (c) write that correctly
   does `row_version = row_version + 1` (mirrors real Hibernate/Tier2-engine
   SQL exactly) → succeeded, `0 → 1`. (d) **multi-statement transaction**
   with one bad bypass `UPDATE` followed by an otherwise-correct one,
   wrapped in `BEGIN TRAN ... COMMIT` → the entire transaction rolled back,
   confirming the trigger's `ROLLBACK TRANSACTION` undoes the whole
   transaction, not just the offending statement. Test trigger dropped,
   `incoterm` row reset to a clean baseline afterward.
2. **Full rollout via real `mvn spring-boot:run`** (runs Flyway for real):
   `Successfully applied 1 migration to schema [dbo], now at version v153`;
   migration's own summary confirmed **238 guard triggers created, 237 old
   V152 bump triggers dropped** (the 238th, `incoterm`, had already been
   dropped manually during step 1's isolated test — expected, not a bug).
   Backend booted clean, zero Hibernate `ddl-auto: validate` errors.
3. **Full JUnit suite run for real** (`mvn test`, not skipped) — the
   strongest evidence here, since dozens of real controllers exercise real
   Hibernate `@Version`-based `UPDATE` statements against real
   `row_version`-bearing tables through this exact trigger. **468 tests: 22
   failures + 12 errors — grepped every surefire report for any mention of
   the trigger's own error text or "RAISERROR"/"guard": zero matches.**
   Every failure matches an already-documented pre-existing baseline class:
   `DeskControllerTest` (Desk retired into Book, V122/123),
   `AuthControllerTest` (2 known login test issues), hardcoded seed-name/
   code drift (`Container`/`Pipeline`/`StorageFacility`/`Tank`/`Truck`
   controller tests), missing FK-target seed rows `pipeline_id=1`
   (`PipelineSegment`/`PipelineTariff`/`PipelineCycle`/`MarginAccount`
   controller tests — the exact class the 2026-07-19 V127 entry already
    flagged), and one likely shared-dev-DB test-ordering collision
   (`PriceIndexSourceControllerTest`'s `EmptyResultDataAccess`, not seen
   before but consistent with the already-documented "fresh test-run
   collisions against the shared dev DB" category). Zero regressions
   attributable to the new guard trigger.
4. Backend and Docker left in the same state as before this session
   (backend stopped; SQL Server container left running since starting it
   was this session's own action, not something to tear back down
   uninvited — mirrors normal dev-session hygiene, not a destructive
   action).

**Standing rule this creates** (also recorded in the handoff doc's
governance section): any future Flyway migration or seed/data-fix script
that does a raw `UPDATE` against a `row_version`-bearing table must now
include `row_version = row_version + 1` in that same statement, or the
migration will fail to apply. No escape hatch exists — this was the user's
explicit choice over a documented, safer alternative (a session-scoped
bypass flag for internal migrations only), on the reasoning that uniform
enforcement is simpler than remembering which writers are exempt.
