```sql
-- V3_add_pg_stat_statements_extension.sql
-- This script applies to the TARGET DATABASE, NOT the OptiDB system database.
-- It's included here as a necessary step for the *target* database to allow OptiDB to collect slow queries.
-- For the OptiDB system to *request* this, the target database needs the extension.
-- THIS IS A MANUAL STEP FOR THE USER, OR THE OptiDB CAN OFFER TO RUN IT (with appropriate permissions).

-- To be run on the TARGET PostgreSQL database:
-- Make sure shared_preload_libraries includes 'pg_stat_statements' in postgresql.conf
-- (You need to restart PostgreSQL after changing postgresql.conf)
-- Then, connect to the target database and run:

-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- SELECT pg_stat_statements_reset(); -- Optionally reset stats

-- Note: The OptiDB system will try to query pg_stat_statements. If it's not enabled,
-- it will return an error which the OptiDB system handles.
```