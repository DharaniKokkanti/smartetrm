# Test / Sample Business Data Snapshot — 2026-07-14

## What changed vs. 2026-07-12

This snapshot exists solely to fix one real bug found in
`2026-07-12/01_core_tier1_test_data.sql`: every `app_user.password_hash`
value was a literal placeholder string (`'$2a$10$placeholderhashvalue...'`),
not a real BCrypt hash. Login against a real backend seeded with that file
never actually worked, for any of the four sample users, with any password.

Per this folder's own release rule (snapshots are immutable once created —
see `../../README.md`), the fix landed as this new dated snapshot rather
than an edit to `2026-07-12/`. Everything else — scope, dataset, table
list — is identical to `2026-07-12/` except for the two changes below.

### 1. Real password hash

All four existing `app_user` rows (`j.smith`, `a.chen`, `r.patel`,
`m.jones`) now have a real BCrypt hash (cost factor 10) of the password
`DevPassword123!` — the same password as the frontend's mock-mode
`dev.admin` shortcut, so one password works in both modes.

### 2. New `admin` super-user account + role assignment

Added a 5th `app_user` row, `user_id = 5`, username `admin`, same password
as above — a system-owner/administrator seat distinct from the four
trading-desk users, intended as the account you provision the rest of the
org through (legal entities, desks, counterparties, further users). Also
added one `dbo.user_role_assignment` row granting this account the `ADMIN`
role (`role_id = 1`, seeded in `V20__rbac_roles_functions.sql`),
pre-approved (`status = 'ACTIVE'`) since it would otherwise need to
approve itself.

**Important caveat**: `AuthController`'s own doc comment states that
per-role API authorization is not wired in yet — every successful login
currently gets a single `ROLE_USER` Spring Security authority regardless
of what's in `user_role_assignment`. So this grant makes the *data*
correct and ready for when that lands, but does not yet change what the
`admin` account can do via the API differently from `j.smith`/etc. today.

## Scope (unchanged from 2026-07-12)

24 "core Tier 1" entity tables, plus `user_role_assignment` (new in this
snapshot, one row):

```
legal_entity, app_user, desk, trader, book, counterparty, contact,
bank_account, tax_registration, gtc, gtc_version, netting_agreement,
cp_commercial_terms, cp_gtc_agreement, location, transport_operator,
vessel, vessel_certificate, pipeline, storage_facility, tank, truck,
market, price_index, user_role_assignment
```

Same "Meridian Trading" fictional dataset as `2026-07-12/` — 3 legal
entities (UK/US/Singapore), desks/traders/books, 6 counterparties, 3
vessels, 2 pipelines, 4 markets/price indices, etc. See `2026-07-12/README.md`
for the full dataset description; not repeated here since it's unchanged.

## Prerequisite

Same as `2026-07-12/`: apply `database/consolidated/snapshots/2026-07-12/`
first (`00_master_data_schema.sql` then `01_master_data_seed.sql`), then
this snapshot's `01_core_tier1_test_data.sql`.

If you already applied `2026-07-12/01_core_tier1_test_data.sql` to your
database, just re-run **this** file on top of it — every `INSERT` is
idempotency-guarded (`IF NOT EXISTS`) on primary key, and the four
`app_user` rows use fixed IDs (1-4) so re-running with the corrected hash
will simply skip them (`user_id` already exists) rather than update them.
**This means re-running this file alone will NOT fix already-inserted
rows with the old placeholder hash** — see "How to apply if you already
loaded 2026-07-12" below.

## How to apply if you already loaded 2026-07-12

The `IF NOT EXISTS` guards mean this file won't overwrite rows that
already exist from `2026-07-12`. To actually pick up the corrected
password hashes, either:

- **Fresh database**: apply `consolidated/2026-07-12/` schema + seed, then
  this file directly (skip `2026-07-12/01_core_tier1_test_data.sql`
  entirely) — cleanest option.
- **Already-seeded database**: run this against `dbo.app_user` directly to
  update the existing 4 rows in place, then run this file to insert the
  new `admin` row and the role assignment:
  ```sql
  UPDATE dbo.app_user
  SET password_hash = '$2b$10$3D4UXXzE2j4u.oiQrNxY3u427qotGpAme5T1wCcocAgeZWVVAjPOK'
  WHERE user_id IN (1, 2, 3, 4);
  ```
  Then run this snapshot's `01_core_tier1_test_data.sql` to add the
  `admin` account (`user_id 5`) and its role assignment (both guarded, so
  safe even if you've already run parts of this file).

## Verification

**Not verified against a live database** — no SQL Server instance is
reachable in the environment this snapshot was authored in. The BCrypt
hash itself was verified independently (Python's `bcrypt.checkpw`
confirms it matches `DevPassword123!`, and Spring Security's
`BCryptPasswordEncoder` accepts `$2a`/`$2b`/`$2y` hashes interchangeably
for verification). The SQL structure (idempotency guards, `IDENTITY_INSERT`
usage, column lists) was checked by eye against `2026-07-12`'s
already-verified pattern, not run end-to-end. Treat this as unverified
until someone applies it to a real database and confirms login works.

## Idempotency

Same convention as `2026-07-12/`: every `INSERT` guarded by
`IF NOT EXISTS (SELECT 1 FROM dbo.<table> WHERE <pk> = <id>)`.
