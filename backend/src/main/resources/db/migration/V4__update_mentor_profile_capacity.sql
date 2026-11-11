-- ==============================================================================
-- Flyway Migration: V4__update_mentor_profile_capacity.sql
-- Description: Set active capacity for dedicated mentor profile (id 4)
-- ==============================================================================

-- Dedicated mentor (id 4) is actively mentoring David Kim in Assignment 2 (1/1 active mentees).
-- At full capacity (current_mentee_count = max_mentees), this mentor is currently fully committed.
UPDATE employee_profiles
SET current_mentee_count = 1, max_mentees = 1, mentor_availability_hrs_per_week = 6
WHERE id = 4;
