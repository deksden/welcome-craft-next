-- ===============================================
-- PHOENIX PROJECT - Database Initialization Script
-- ===============================================
-- @file scripts/db-init/01-init-extensions.sql
-- @description PostgreSQL extensions setup for WelcomeCraft
-- @version 1.1.0
-- @date 2025-07-02
-- @updated TASK-AI-TOOLS-IMPLEMENTATION - Добавлено расширение pgvector для семантического поиска

-- Enable required PostgreSQL extensions for WelcomeCraft
-- These extensions are needed for UUID support and other features

-- UUID generation support (required for primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: pgcrypto for additional crypto functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optional: unaccent for text search (future feature)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- НОВОЕ: pgvector для семантического поиска артефактов
-- Позволяет создавать и использовать векторные эмбеддинги для семантического поиска
CREATE EXTENSION IF NOT EXISTS vector;

-- Set timezone to UTC for consistency
SET timezone = 'UTC';

-- Create database-specific settings
-- Note: Skip ALTER DATABASE for test DB as it might not exist yet
-- ALTER DATABASE welcomecraft_local SET timezone TO 'UTC';
-- ALTER DATABASE welcomecraft_beta SET timezone TO 'UTC';

-- Log initialization completion
\echo 'PHOENIX PROJECT: Database extensions initialized successfully'

-- END OF: scripts/db-init/01-init-extensions.sql