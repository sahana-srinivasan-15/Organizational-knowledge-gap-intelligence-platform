-- ==============================================================================
-- Flyway Migration: V12__add_authenticity_and_quiz_fields_to_certificates.sql
-- Description: Adds ML authenticity evaluation score and diagnostic quiz gating
--              status to course completion certificates.
-- ==============================================================================

ALTER TABLE course_certificates
ADD COLUMN IF NOT EXISTS authenticity_score NUMERIC(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS quiz_passed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

