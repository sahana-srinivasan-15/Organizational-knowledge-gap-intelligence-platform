-- ==============================================================================
-- Flyway Migration: V11__add_withdrawn_status_to_course_approval.sql
-- Description: Allow employees to withdraw pending course approval requests
-- ==============================================================================

ALTER TABLE course_approval_requests DROP CONSTRAINT IF EXISTS course_approval_requests_status_check;

ALTER TABLE course_approval_requests ADD CONSTRAINT course_approval_requests_status_check 
CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'WITHDRAWN'));

