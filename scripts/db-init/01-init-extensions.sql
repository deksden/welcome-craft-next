-- ===============================================
-- PHOENIX PROJECT - Database Initialization Script
-- ===============================================
-- @file scripts/db-init/01-init-extensions.sql
-- @description PostgreSQL extensions setup for WelcomeCraft
-- @version 1.0.0
-- @date 2025-06-29

-- Enable required PostgreSQL extensions for WelcomeCraft
-- These extensions are needed for UUID support and other features

-- UUID generation support (required for primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: pgcrypto for additional crypto functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optional: unaccent for text search (future feature)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Set timezone to UTC for consistency
SET timezone = 'UTC';

-- Create database-specific settings
ALTER DATABASE welcomecraft_local SET timezone TO 'UTC';
ALTER DATABASE welcomecraft_beta SET timezone TO 'UTC';

-- Log initialization completion
\echo 'PHOENIX PROJECT: Database extensions initialized successfully'

-- END OF: scripts/db-init/01-init-extensions.sql