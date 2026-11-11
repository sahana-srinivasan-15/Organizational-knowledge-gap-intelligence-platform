-- ==============================================================================
-- Flyway Migration: V24__remove_david_kim_assigned_mentors.sql
-- Description: Remove all active and historical mentor assignments for David Kim (Profile ID 2),
--              leaving only peer mentor recommendations with Connect actions.
-- ==============================================================================

-- 1. Remove mentorship messages linked to David Kim's assignments
DELETE FROM mentorship_messages
WHERE mentor_assignment_id IN (
    SELECT id FROM mentor_assignments WHERE mentee_id = 2
);

-- 2. Remove all mentor assignments for David Kim (Profile 2)
DELETE FROM mentor_assignments
WHERE mentee_id = 2;

-- 3. Recalculate current_mentee_count for all mentors
UPDATE employee_profiles ep
SET current_mentee_count = (
    SELECT COUNT(DISTINCT ma.mentee_id)
    FROM mentor_assignments ma
    WHERE ma.mentor_id = ep.id AND ma.status IN ('APPROVED_BY_MANAGER', 'ACTIVE')
)
WHERE ep.mentor_opt_in = true;

