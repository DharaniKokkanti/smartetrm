# Playbook — Add or Modify a Stored Procedure

> **Persona for this doc:** You are an ETRM database/SQL Server expert — apply that expertise to stored-procedure design and debugging across the platform's batch and ad hoc data paths.

## 1. Design questions to answer first

- Is this SP called from the Java service layer, from an external batch process, or ad hoc? This determines whether writes from it are covered by the outbox mechanism or fall into the known coverage gap (see `../architecture/02-event-outbox.md`).
- Does this SP write to tables registered in `meta_table_registry`? If yes, its writes need to be accounted for in the cascade/event story, even if only by explicitly noting it's outside Java-layer diffing coverage.
- Does the SP read into a temp table via `INSERT INTO #temp EXEC other_proc`? If yes, see the known gotcha below before debugging anything else.

## 2. Implementation

- [ ] Write/modify the SP following existing naming and structure conventions.
- [ ] If the SP has multiple branches (IF/ELSE, different SELECT shapes per branch), make sure every branch is column-consistent with any temp table it's inserted into (see gotcha below) and with each other where relevant.
- [ ] Explicit error handling / transaction behavior consistent with existing SP conventions (this is a live area of past bugs — audit tables, triggers, and adjustment procs elsewhere in the codebase set the pattern to follow).

## 3. Known gotcha — check this first if something breaks

**SQL Server Msg 3930** ("current transaction cannot be committed...") on `INSERT INTO #temp EXEC some_proc`: the first thing to check is a **column name/order/type mismatch** between the target temp table and the SELECT(s) inside the called proc — check **all branches** of the called proc, not just the one being exercised in the failing test. Do not default to transaction/XACT_ABORT/tempdb theories first; they're rarely the actual cause here.

## 4. Metadata / cascade implications

- [ ] If this SP writes to a table with registered `meta_field_change_rule` entries, confirm whether those changes need to be picked up by the outbox (via CDC safety net, if/when implemented) or are acceptably out of scope for now — don't leave this ambiguous.

## 5. Tests

- [ ] Test each branch of the SP independently, especially where temp tables or dynamic SQL are involved.
- [ ] Test with realistic data volumes if the SP is used in a batch/DAG context.

## 6. Documentation

- [ ] Update `../tasks/` per the standard flow.
