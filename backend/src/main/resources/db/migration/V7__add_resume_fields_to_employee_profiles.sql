-- ==============================================================================
-- Flyway Migration: V7__add_resume_fields_to_employee_profiles.sql
-- Description: Add resume file metadata columns to employee_profiles table
-- ==============================================================================

ALTER TABLE employee_profiles
    ADD COLUMN IF NOT EXISTS resume_file_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS resume_file_path VARCHAR(500),
    ADD COLUMN IF NOT EXISTS resume_content_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS resume_file_size BIGINT,
    ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMP WITH TIME ZONE;
