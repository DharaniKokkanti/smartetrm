#!/bin/bash
set -euo pipefail

SQLCMD=/opt/mssql-tools18/bin/sqlcmd

"$SQLCMD" -S sqlserver -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "
IF DB_ID('ETRM_DB') IS NULL
BEGIN
  CREATE DATABASE ETRM_DB;
END
"

"$SQLCMD" -S sqlserver -U sa -P "$MSSQL_SA_PASSWORD" -C -d ETRM_DB -Q "
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'etrm_app')
BEGIN
  CREATE LOGIN etrm_app WITH PASSWORD = '$ETRM_APP_DB_PASSWORD';
END
ELSE
BEGIN
  -- keep the login in sync with ETRM_APP_DB_PASSWORD even if the login
  -- pre-existed (e.g. from before .env's password was last changed) —
  -- otherwise this silently no-ops and the backend fails to connect with
  -- a stale password.
  ALTER LOGIN etrm_app WITH PASSWORD = '$ETRM_APP_DB_PASSWORD';
END

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'etrm_app')
BEGIN
  CREATE USER etrm_app FOR LOGIN etrm_app;
  ALTER ROLE db_owner ADD MEMBER etrm_app;
END
"

echo "etrm-system db-init: ETRM_DB + etrm_app login/user ready."
