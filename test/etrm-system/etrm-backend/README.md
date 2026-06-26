# ETRM Backend

Spring Boot 3.3.x / Java 21 backend for the ETRM master data tier — built to match
the exact REST contract the frontend (`etrm-frontend/`) was already built against.

## ⚠️ Verification status — read this first

**This code could not be compiled or run in the environment it was written in.**
Maven Central (`repo.maven.apache.org` / `repo1.maven.org`) returned HTTP 403
through that sandbox's network proxy — it isn't on the allowlist, the same way
Docker Hub wouldn't be. That means:

- `mvn compile` / `mvn clean install` were never run against this code
- No dependency resolution, no annotation processing (Lombok), no actual
  bytecode verification happened
- Every file was written and manually reviewed for correctness, but **you are
  the first compiler this code will see**

This is a meaningfully different confidence level than the frontend, which was
type-checked, linted, security-audited, and build-verified at every step
because npm's registry *was* reachable. Budget time for a first-build
debugging pass — likely candidates for issues: Lombok annotation processing
quirks, minor import omissions, and the Flyway `GO`-batch-separator handling
described below, which is the single piece of this backend I'm least able to
vouch for without a real SQL Server to test against.

## Prerequisites

- Java 21 (`java -version` should show 21.x)
- Maven 3.9+ (or use the Maven Wrapper if you generate one: `mvn -N wrapper:wrapper`)
- A real SQL Server 2022 instance — local Docker, Azure SQL, or on-prem.
  `localhost:1433` by default; override via env vars (see below).

## First-time setup

```bash
# 1. Create the database (if it doesn't exist yet)
sqlcmd -S localhost -U sa -P <your-sa-password> -Q "CREATE DATABASE ETRM_DB"

# 2. Create the app's service account (least-privilege, not sa)
sqlcmd -S localhost -d ETRM_DB -U sa -P <your-sa-password> -Q "
  CREATE LOGIN etrm_app WITH PASSWORD = '<choose-a-strong-password>';
  CREATE USER etrm_app FOR LOGIN etrm_app;
  ALTER ROLE db_owner ADD MEMBER etrm_app;
"

# 3. Set connection env vars (or edit application.yml directly)
export DB_URL="jdbc:sqlserver://localhost:1433;databaseName=ETRM_DB;encrypt=true;trustServerCertificate=true"
export DB_USERNAME=etrm_app
export DB_PASSWORD=<your-chosen-password>
export JWT_SECRET=$(openssl rand -base64 48)   # MUST override the dev default before any real use

# 4. Build and run — Flyway applies all 15 migrations automatically on startup
mvn clean install
mvn spring-boot:run
```

The app starts on `http://localhost:8080`. The frontend's Vite dev server
already proxies `/api/v1/*` here (see `etrm-frontend/vite.config.ts`) — set
`VITE_USE_MOCKS=false` in the frontend's `.env.development` once this is
running, and the same screens that worked against MSW mocks should work
against this for real, with zero frontend code changes (the contract was
built to match exactly).

### Testing login

Apply the dev-only seed (NOT a Flyway migration — see the file's own header
for why):

```bash
sqlcmd -S localhost -d ETRM_DB -U etrm_app -P <password> -i src/main/resources/dev-seed.sql
```

Then:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dev.admin","password":"DevPassword123!"}'
```

Should return a JWT. Use it as `Authorization: Bearer <token>` for every
other endpoint (everything except `/api/v1/auth/**` requires it).

## Smoke-testing without SQL Server (dev profile)

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Boots against an in-memory H2 database instead — lets you confirm the app
starts and the Legal Entity / Counterparty / Guarantee endpoints respond,
without needing a real SQL Server instance available. **Tier 2's metadata
endpoint will NOT work on this profile** — `ReferenceDataMetadataService`
queries SQL Server-specific system catalogs (`sys.check_constraints`,
`sys.foreign_keys`, `INFORMATION_SCHEMA`) that don't exist in H2's dialect.
Everything else is fair game for a quick local smoke test.

## What needs real-environment verification most

In rough order of "how likely is this to need a fix":

1. **Flyway + `GO` batch separators.** Every migration file (copied directly
   from the project's SQL scripts) uses `GO` to separate batches, which is
   an SSMS/sqlcmd convention, not real T-SQL — the JDBC driver doesn't
   understand it natively. The `flyway-sqlserver` dependency is included
   specifically because Flyway's SQL Server-aware parser is documented to
   handle `GO` as a batch delimiter automatically. I'm fairly confident this
   is correct, but it's the one piece of plumbing here I could not exercise
   even partially without a real SQL Server connection.
2. **`ReferenceDataMetadataService`'s system-catalog SQL.** Hand-written
   T-SQL against `sys.check_constraints` / `sys.foreign_keys` /
   `INFORMATION_SCHEMA`, including a regex that extracts CHECK-constraint
   literal values from the constraint's `definition` text. The regex logic
   mirrors what the project's Python documentation generator does (which
   *was* tested extensively against the real SQL files) — but the SQL
   queries that feed it were never run against a live server.
3. **Lombok annotation processing.** `@Getter`/`@Setter` should be
   unremarkable, but Lombok depends on annotation-processor wiring that
   varies by IDE/Maven setup — if fields seem to have no getters/setters at
   compile time, check Lombok is actually being processed (most IDEs need a
   plugin; Maven needs the processor on the annotation processor path,
   which `spring-boot-starter-parent` should handle by default).

## Architecture notes

- **No JPA relationships anywhere** (`@ManyToOne`, `@OneToMany`) — every
  foreign key is a plain `Long` id column, deliberately. This avoids lazy-
  loading/proxy-serialization issues entirely and means every entity is
  safe to return directly from a controller — no separate DTO layer exists
  for the same reason. This trades away some JPA convenience (no cascading
  saves, no `entity.getParent().getName()` navigation) for serialization
  simplicity, which matters more here since almost every endpoint is a thin
  CRUD wrapper.
- **The polymorphic address/contact/bank_account pattern** (entity_type +
  entity_id, shared by `legal_entity` and `counterparty`) is modeled as
  three standalone entities in `com.etrm.system.polymorphic`, not a JPA
  inheritance hierarchy — matches how the DB schema itself works (a data
  convention, not a real foreign key relationship).
- **No permission/role enforcement.** Every authenticated request can call
  every endpoint. See `SecurityConfig`'s class-level comment — this is
  deliberate, matching the frontend's explicit deferral of the role system
  to a future, separate `role` table (Master Data Entry Technical Design
  doc, Section 6). Do not bolt an `@PreAuthorize` enum-based check onto
  anything here; it'll need ripping out again.
- **Tier 2's generic CRUD** (`ReferenceDataCrudService`) builds SQL with
  table/column names interpolated directly into query strings — this is
  the one place in the codebase that isn't pure JPA. Every identifier is
  validated (regex allowlist + cross-checked against schema-derived
  metadata) before interpolation; every *value* still goes through JDBC
  parameter binding (`?` placeholders). Read the class-level comment before
  touching this file.
