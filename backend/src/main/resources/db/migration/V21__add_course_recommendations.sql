-- ==============================================================================
-- Flyway Migration: V21__add_course_recommendations.sql
-- Description: Supports direct Course Recommendations by Mentors, Managers, and Admins,
--              updating notification constraints and creating course_recommendations table.
-- ==============================================================================

-- 1. Extend notifications check constraint to include COURSE_RECOMMENDATION
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
        'ASSESSMENT_DUE',
        'MENTOR_RECOMMENDED',
        'MENTOR_APPROVED',
        'MENTOR_ASSIGNED',
        'COURSE_PROGRESS',
        'RISK_ALERT',
        'GENERAL',
        'LIVE_CLASS_SUGGESTION',
        'MATERIAL_SUGGESTION',
        'MENTOR_MESSAGE',
        'COURSE_RECOMMENDATION'
    )
);

-- 2. Create course_recommendations table
CREATE TABLE IF NOT EXISTS course_recommendations (
    id BIGSERIAL PRIMARY KEY,
    employee_profile_id BIGINT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    recommended_by_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommended_by_role VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_course_rec_emp ON course_recommendations(employee_profile_id);
CREATE INDEX IF NOT EXISTS idx_course_rec_course ON course_recommendations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_rec_sender ON course_recommendations(recommended_by_id);

-- 3. Seed an initial recommendation for David Kim (EmployeeProfile ID 2) from Mentor Alex Morgan (User ID 3)
INSERT INTO course_recommendations (employee_profile_id, course_id, recommended_by_id, recommended_by_role, notes, created_at)
SELECT 2, 1, 3, 'MENTOR', 'Essential foundational course on Spring Boot and Microservices to eliminate your skill gap.', CURRENT_TIMESTAMP - INTERVAL '2 hours'
WHERE NOT EXISTS (
    SELECT 1 FROM course_recommendations WHERE employee_profile_id = 2 AND course_id = 1
);

-- 4. Seed notification for David Kim (User ID 4)
INSERT INTO notifications (user_id, title, message, type, action_url, reference_id, sender_id, is_read, created_at)
SELECT 4, 'Course Recommended by Mentor Alex Morgan', 'Your mentor Alex Morgan recommended "Microservices Architecture with Spring Boot". Click to review and add to your roadmap.', 'COURSE_RECOMMENDATION', '/dashboard', 1, 3, FALSE, CURRENT_TIMESTAMP - INTERVAL '2 hours'
WHERE NOT EXISTS (
    SELECT 1 FROM notifications WHERE user_id = 4 AND type = 'COURSE_RECOMMENDATION'
);

