# Bootstrapping the First Admin User (Vendor Runbook)

**Audience: us, the vendor, standing up a new environment (a fresh dev DB,
a new customer deployment, etc.) — not a customer self-service flow.**
There is currently no self-service way to do this; see "Why this needs a
runbook" below.

## Why this needs a runbook

No Flyway migration seeds a single `app_user` row (checked directly against
every migration file — `grep -rln "INSERT INTO dbo.app_user" database/*.sql`
returns nothing outside the dev-only `database/test-data/` folder, which is
hand-authored sample data, not part of the real migration chain). So on a
genuinely fresh deployment, `dbo.app_user` is completely empty.

That's a real chicken-and-egg problem:

- `POST /api/v1/auth/login` only checks existing rows in `app_user` — there's
  nothing to log in as.
- The only way to *create* a user, `POST /api/v1/admin/users`
  (`SystemUserController`), requires an `Authorization: Bearer <token>`
  header — and you can't get a token without an existing user to log in as.

There is no bootstrap/setup-wizard endpoint that's exempt from
authentication (`SecurityConfig` only permits `/api/v1/auth/**` and
`/actuator/health` without a token). Until one exists, the first admin user
on any environment has to be inserted directly via SQL, once, by us.

**What does NOT need this workaround**: the `ADMIN` role itself. `user_role`
*is* seeded by a real migration (`V20__rbac_roles_functions.sql`) —
`ADMIN`/`TRADER`/`RISK_MANAGER`/`OPERATIONS`/`COMPLIANCE`/`VIEWER` all exist,
`APPROVED`, with every `app_function` granted `READ_WRITE` to `ADMIN`, on
every environment out of the box. Only the *user* and their *role
assignment* need bootstrapping — never the role itself.

## Prerequisites

- Direct SQL access to the target database (the same access used to run
  Flyway migrations).
- The backend's Maven project checked out locally (`etrm-backend/`) — used
  only to resolve the `spring-security-crypto` classpath for hashing the
  password identically to how the app itself would (`BCryptPasswordEncoder`,
  configured in `PasswordEncoderConfig`). No separate bcrypt tool needed.
- A `legal_entity_id` to attach the admin account to (`app_user.legal_entity_id`
  is `NOT NULL`) — pick the internal/holding entity for the environment.

## Steps

### 1. Generate a real bcrypt hash for the initial password

```bash
cd etrm-backend
mvn -q dependency:build-classpath -Dmdep.outputFile=/tmp/cp.txt
CP=$(cat /tmp/cp.txt)
echo 'System.out.println(org.springframework.security.crypto.bcrypt.BCrypt.hashpw("REPLACE_WITH_A_REAL_PASSWORD", org.springframework.security.crypto.bcrypt.BCrypt.gensalt(10)));' \
  | jshell --class-path "$CP" -q -
```

This prints a `$2a$10$...` hash — copy it for the next step. (Using `jshell`
against the project's own resolved `spring-security-crypto` dependency means
this is the *exact* hashing algorithm/cost factor the running app uses —
not an approximation from some other bcrypt tool.)

### 2. Look up a `legal_entity_id` and the `ADMIN` role's `role_id`

```sql
SELECT legal_entity_id, entity_name FROM dbo.legal_entity WHERE is_active = 1;
SELECT role_id FROM dbo.user_role WHERE role_code = 'ADMIN'; -- always exists — seeded by V20
```

### 3. Insert the user

```sql
INSERT INTO dbo.app_user
    (legal_entity_id, username, email, password_hash, full_name, is_active, created_by, updated_by)
VALUES
    (<legal_entity_id>, 'admin', 'admin@yourcompany.example',
     '<hash from step 1>', 'System Administrator', 1, 'SYSTEM', 'SYSTEM');
```

### 4. Assign the `ADMIN` role directly as `ACTIVE`

Normal role assignment goes through an approval workflow
(`POST /api/v1/users/{id}/role-assignments` → `PENDING_APPROVAL`, then
`PATCH /role-assignments/{id}/approve` by an existing admin). There is no
existing admin yet, so this one time the assignment is inserted pre-approved
directly:

```sql
INSERT INTO dbo.user_role_assignment
    (user_id, role_id, status, assigned_by, approved_by, approved_at, valid_from, is_active)
SELECT
    u.user_id, r.role_id, 'ACTIVE', 'SYSTEM', 'SYSTEM', SYSUTCDATETIME(), CAST(SYSUTCDATETIME() AS DATE), 1
FROM dbo.app_user u, dbo.user_role r
WHERE u.username = 'admin' AND r.role_code = 'ADMIN';
```

### 5. Verify

```bash
curl -s http://localhost:8080/api/v1/auth/login -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"REPLACE_WITH_THE_SAME_REAL_PASSWORD"}'
```

Should return a real JWT. From here on, **every subsequent user should be
created through the real API** (`POST /api/v1/admin/users`, then a normal
`PENDING_APPROVAL` → `approve` role assignment) — this direct-SQL path is
only for the very first account on a given environment.

## Important notes

- **Change the bootstrap password immediately** after first login, in any
  environment beyond a local dev box — it was typed into a terminal command
  and shell history.
- Effective permission *enforcement* is not yet built — see
  `SecurityConfig`'s own note: every authenticated endpoint is currently
  reachable by any logged-in user regardless of role. This bootstrap
  procedure correctly provisions the `ADMIN` role assignment for when
  enforcement lands, but doesn't currently grant different *effective*
  access than any other account.
- Do not repeat this direct-SQL approach for a second/third admin once the
  first one exists — use the real API and approval workflow, so the audit
  trail (`assigned_by`/`approved_by`) reflects an actual person, not
  `'SYSTEM'`.
