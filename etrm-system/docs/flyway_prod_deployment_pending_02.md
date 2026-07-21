# Pending Project — Flyway production-deployment hardening

**Status: not started — identification only, nothing applied yet.**

## What this is

Confirmed how DB versioning works today: Flyway, driven by
`etrm-backend/src/main/resources/application.yml`'s `flyway:` block
(`enabled: true`, `locations: classpath:db/migration`,
`baseline-on-migrate: true`, `out-of-order: false`). Migrations live at
`etrm-backend/src/main/resources/db/migration/V<N>__*.sql`, mirrored
read-only for review at `etrm-system/database/<N>_*.sql`. There is no
`application-prod.yml` — production runs on the same base `application.yml`
dev also inherits from (only `application-dev.yml` diverges, to disable
Flyway against H2). Applied-vs-pending state lives in Flyway's own
`flyway_schema_history` table on each target DB (query directly, or
`mvn flyway:info`).

Three things flagged for review, none confirmed as problems yet — just
worth a deliberate look before the next prod deploy:

1. **`baseline-on-migrate: true` in prod.** Correct for adopting Flyway on
   a pre-existing DB with no history table, and a no-op once a baseline
   row exists — but worth confirming prod's `flyway_schema_history`
   already has that baseline row rather than this flag silently doing
   something on some future fresh-environment stand-up.
2. **No prod-specific Flyway profile.** Nothing exists today to set
   prod-only Flyway behavior (e.g. explicit `clean-disabled: true` — even
   though that's Flyway's default — or `validate-on-migrate`) without also
   touching the file dev/local read from. Not a bug; just no separation
   point exists yet if one is ever needed.
3. **Migrations run automatically on app boot, in-line with startup.**
   Since Flyway fires during Spring Boot startup itself, any deploy that
   ships a new `V*.sql` runs it live the moment the new instance boots —
   there's no separate/gated "run migrations first" step inside this repo.
   If CI/CD runs `mvn flyway:migrate` as its own pre-deploy step, this is
   moot; if not, worth deciding whether that's the desired behavior for
   production.

## Next steps when this gets picked up

1. Query prod's `flyway_schema_history` to confirm a baseline row exists.
2. Decide whether an `application-prod.yml` (or equivalent env-specific
   override) is worth adding for explicit prod Flyway settings.
3. Confirm with whoever owns the deploy pipeline whether migrations are
   gated before traffic cutover today, or run in-line at app boot as the
   code currently implies.
