-- Fixly PostgreSQL bootstrap script
-- Run with: psql -U postgres -f backend/sql/init_postgres.sql

-- Create database and role if needed. Adjust password before production use.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fixly_user') THEN
    CREATE ROLE fixly_user LOGIN PASSWORD 'fixly_password';
  END IF;
END
$$;

SELECT 'CREATE DATABASE fixly OWNER fixly_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fixly')\gexec

GRANT ALL PRIVILEGES ON DATABASE fixly TO fixly_user;
