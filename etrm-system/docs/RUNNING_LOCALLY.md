# Running SmartETRM Locally — 100% Free Stack

> **Persona for this doc:** You are an ETRM platform environment/DevOps expert — apply that expertise to correctly stand up this multi-service stack (Spring Boot backend, React frontend, SQL Server) end to end, the same way you'd stand up any enterprise trading platform's local dev environment.

Every piece of this stack has a free tier suitable for local dev. This doc
covers what's free and how, then walks through getting the whole app running
end to end.

## What's free, and the catch (if any)

| Layer | What | Free? | Notes |
|---|---|---|---|
| Database | SQL Server 2022 **Developer edition**, via Docker | Yes, full features | Licensed for dev/test only — not production. That's fine here. |
| Container runtime | Docker Desktop | Yes for individuals, education, small business | Docker Desktop's subscription requirement only kicks in for orgs with 250+ employees or $10M+ revenue. Not a concern for personal/small-team dev. |
| Backend runtime | OpenJDK 25/26 (Homebrew) | Yes | Not Oracle JDK — Homebrew's `openjdk` formula is the free OpenJDK build, no license terms to worry about. |
| Backend framework | Spring Boot 3.3 | Yes | Apache 2.0 license. |
| Build tool | Maven | Yes | Apache 2.0 license. |
| Frontend runtime | Node.js / npm | Yes | — |
| Frontend framework | React 18 | Yes | MIT license. |
| UI library | Ant Design 5 | Yes | MIT license. |
| Data grid | AG Grid **Community** edition | Yes | The Enterprise edition is paid; this project only uses Community (confirmed in `package.json` — `ag-grid-community`, not `ag-grid-enterprise`). |
| Migration tool | Flyway | Yes | OSS edition (`flyway/flyway` community, not Flyway Teams). |

Nothing in this stack requires a paid license for local development.

## Prerequisites

- Docker Desktop (or another Docker Engine — Colima, Rancher Desktop, etc. all work)
- Java 25+ (`brew install openjdk`) — check with `java -version`
- Maven 3.9+ (`brew install maven`)
- Node.js 20+ / npm

## 1. Start SQL Server (Docker)

From `etrm-system/`:

```bash
cp .env.example .env
# edit .env and set real passwords for MSSQL_SA_PASSWORD / ETRM_APP_DB_PASSWORD

docker compose up -d sqlserver
docker compose up db-init      # creates ETRM_DB + the etrm_app login, idempotent
```

`docker compose up db-init` is safe to re-run any time — every statement in
`docker/db-init/init-db.sh` checks for existing state first.

**Apple Silicon (M1/M2/M3) note:** `mcr.microsoft.com/mssql/server` has no
arm64-native image yet, so this runs under Rosetta emulation via
`platform: linux/amd64` in `docker-compose.yml`. It works, just slower to
start (health check has a 30s grace period for this). If startup time
becomes annoying, `mcr.microsoft.com/azure-sql-edge` is an arm64-native,
SQL-Server-compatible alternative — swap the image in `docker-compose.yml`
and drop the `platform:` line. Azure SQL Edge is missing a few SQL Server
features (full-text search, some CLR support) that this schema doesn't use,
so it's a safe swap here.

## 2. Configure the backend

```bash
cd etrm-backend
cp .env.example .env
# set DB_PASSWORD to the same value as ETRM_APP_DB_PASSWORD above
```

`.env` is read automatically by the "Backend: Debug (real SQL Server)" VS
Code launch config (`etrm.code-workspace`). If you're running from the
terminal instead, export the vars first:

```bash
set -a; source .env; set +a
```

`DB_URL`'s value is quoted in `.env` (`DB_URL="jdbc:sqlserver://...;...;..."`)
specifically so this works — the value contains `;`, which bash treats as a
command separator when sourcing an unquoted `KEY=value` line, silently
truncating `DB_URL` to just `jdbc:sqlserver://localhost:1433` and losing
`databaseName`/`encrypt`/`trustServerCertificate`. If you ever recreate
`.env` by hand, keep the quotes — VS Code's `envFile` launch config parses
either form fine, but a bare terminal `source` does not.

## 3. Run the backend

```bash
mvn clean install
mvn spring-boot:run
```

Flyway applies all 96 migrations automatically on startup. This has been
verified end-to-end against a real, freshly-created SQL Server 2022
container (not just reviewed) — see "Migration chain" below for what that
verification found and fixed.

The app starts on `http://localhost:8080`.

**Fixed: `mvn spring-boot:run` failing with `Unsupported class file major
version 69`.** Root cause wasn't the Maven plugin — it's Spring Framework's
*own* bundled ASM (`spring-core-6.1.14.jar`, used at runtime for
`@ComponentScan` classpath scanning) not yet understanding Java 25 bytecode
(class file major version 69). No JDK swap fixes this — javac itself would
refuse `--release 25` on an older JDK. The actual fix: the codebase only
uses `record` (a Java 16+ feature) and nothing Java 25-specific, so
`pom.xml`'s `<java.version>` was lowered from `25` to `21` (LTS, well
outside any ASM version-lag window). Verified clean `mvn compile` and a full
`mvn spring-boot:run` startup against the real Dockerized SQL Server after
this change.

## 4. Run the frontend

```bash
cd etrm-frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`, proxying `/api/v1/*` to the backend on
`:8080`. Set `VITE_USE_MOCKS=false` in `.env.development` once the real
backend is running, to point the UI at real data instead of MSW mocks.

## Migration chain — what "verified" means here

The backend README previously flagged that none of the 96 SQL migrations had
ever been run against a real SQL Server instance — only hand-reviewed. Doing
the Docker setup above was also the first opportunity to actually test that
claim. It wasn't clean: the migration chain had **~40 real bugs**, all now
fixed in place (in both `etrm-backend/src/main/resources/db/migration/` and
the mirrored `database/*.sql` copies). Recurring categories, roughly in the
order they were found:

1. **Temporal table setup** (V1, V6, V7) — `PERIOD FOR SYSTEM_TIME` must be
   declared in the same `ALTER TABLE ADD` statement as the generated
   `valid_from`/`valid_to` columns; the original scripts split them across
   two statements, which SQL Server rejects outright.
2. **Missing `updated_by`** in a few seed `INSERT`s where the target column
   is `NOT NULL` with no default.
3. **SQL Server treats multiple `NULL`s as duplicates** under a plain
   `UNIQUE` constraint (unlike Postgres) — nullable unique columns need a
   filtered unique index instead.
4. **Batch-compile-time column resolution**: a column added by one
   `ALTER TABLE ADD` can't be referenced by a `CHECK` constraint, index, or
   second `ALTER TABLE` later in the *same unbatched script* — needs a `GO`
   between them. This was the single most common bug, recurring in a dozen
   files that had zero `GO` statements at all.
5. **Dropping a column requires dropping every dependent object first** —
   indexes, `CHECK` constraints, `UNIQUE` constraints, and (for system-
   versioned tables) the matching column on the `_history` table, plus
   matching nullability between the two. SQL Server does not cascade any of
   this automatically the way some other engines do.
6. **Unnamed inline `DEFAULT` constraints** (e.g. `status VARCHAR(20) DEFAULT
   'ACTIVE'`) get an auto-generated name, so `DROP COLUMN` fails unless you
   look the generated name up dynamically first (`sys.default_constraints`)
   — a pattern that recurred across a dozen currency/status/type-code
   conversions.
7. **Foreign keys require exact type match** — including length. Several
   `VARCHAR(10)` columns were meant to reference a `VARCHAR(20)` code column
   in another table; SQL Server rejects the FK outright rather than
   truncating.
8. **Demo/seed data referencing rows that don't exist on a fresh database**
   — several files seeded example trades/orders/bolmo agreements assuming
   specific `trade_id`/`counterparty_id` values already existed (mirroring
   the frontend's MSW mock IDs), which are never actually inserted by any
   migration. These are now guarded to skip cleanly instead of throwing an
   FK violation.
9. **A few outright missing tables/products** referenced by later migrations
   but never created by any earlier one (`trade_lng_detail`,
   `trade_metals_detail`, `trade_agri_detail`, and benchmark products like
   `BRENT-CRUDE`/`WTI-CRUDE`/`CBOT-CORN`) — added at the point they were
   first needed, matching the surrounding schema's conventions.

None of this was cosmetic — every one of these blocked the migration chain
from completing on a real SQL Server instance. The fix-forward process
re-ran `flyway migrate` against a freshly wiped database after every change
until all 96 applied cleanly (confirmed via `flyway info` showing all 96 as
`Success`), then confirmed a second `migrate` run is a clean no-op.

**Fixed: `V14`/`V16`/`V18` drift between `etrm-backend/.../db/migration/`
(the copy Flyway actually reads) and the `database/` mirror** (`V16` was
missing from `database/` entirely; `V14`/`V18` had stale content). All 96
files are now confirmed byte-identical between the two locations.

## Known gap beyond the migration chain: JPA entity/schema mismatches

Getting the backend running end to end (not just the migrations) surfaced a
further, separate class of bug: at least one JPA `@Entity` class disagrees
with the real schema's column types (`Address.addressId` is mapped as
`Long`/`BIGINT`; the actual `address.address_id` column is `INT IDENTITY`
per `V1`). Hibernate's schema validation (`ddl-auto: validate`) catches this
at startup and refuses to boot rather than silently running with a mismatch.

This is expected, not a regression — the backend README already disclosed
"this code could not be compiled or run in the environment it was written
in" and "you are the first compiler this code will see." The migration
chain fix above only verified the *SQL side*; the ~130-table JPA entity
layer has never been checked against the live schema at all, and may have
more of these (most likely candidates: any entity whose PK the seed
migrations declared `INT IDENTITY` rather than `BIGINT IDENTITY`). Not
fixed as part of this pass — flagging it here as the next thing to verify
if you're taking the backend further, rather than silently working around
it.
