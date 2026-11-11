-- ==============================================================================
-- Flyway Migration: V19__mentorship_chat_and_suggestions.sql
-- Description: Enables Mentorship Chat, Live Class & Material Recommendations,
--              and Dashboard Notifications for Peer Mentoring.
-- ==============================================================================

-- 1. Extend notifications table type constraint & add actionable columns
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
        'MENTOR_MESSAGE'
    )
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url VARCHAR(500);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id BIGINT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- 2. Create mentorship messages table
CREATE TABLE IF NOT EXISTS mentorship_messages (
    id BIGSERIAL PRIMARY KEY,
    mentor_assignment_id BIGINT NOT NULL REFERENCES mentor_assignments(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    suggestion_type VARCHAR(50) DEFAULT 'NONE' CHECK (suggestion_type IN ('NONE', 'LIVE_CLASS', 'MATERIAL', 'CUSTOM')),
    suggested_live_class_id BIGINT REFERENCES live_classes(id) ON DELETE SET NULL,
    suggested_material_id BIGINT REFERENCES skill_materials(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_msg_assignment ON mentorship_messages(mentor_assignment_id);
CREATE INDEX IF NOT EXISTS idx_mentor_msg_sender ON mentorship_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_mentor_msg_created ON mentorship_messages(created_at);

-- 3. Ensure assignment 1 for David Kim (Mentee 2) & Alex Morgan (Mentor 1) is ACTIVE / APPROVED_BY_MANAGER
UPDATE mentor_assignments
SET status = 'APPROVED_BY_MANAGER',
    assigned_at = CURRENT_TIMESTAMP,
    notes = 'Active peer mentorship connection approved by Engineering Manager for Spring Boot Framework mastery.'
WHERE id = 1;

-- Update mentor capacity and active count
UPDATE employee_profiles
SET mentor_opt_in = true,
    current_mentee_count = (
        SELECT COUNT(DISTINCT mentee_id)
        FROM mentor_assignments
        WHERE mentor_id = employee_profiles.id AND status IN ('APPROVED_BY_MANAGER', 'ACTIVE')
    )
WHERE id = 1;

-- 4. Seed initial rich mentorship messages & suggestions for Assignment 1
INSERT INTO mentorship_messages (mentor_assignment_id, sender_id, message_text, suggestion_type, suggested_live_class_id, created_at)
SELECT 1, 3, 'Hi David! Welcome to our peer mentorship track. I strongly recommend attending our upcoming Live Class on Spring Cloud & Microservices.', 'LIVE_CLASS', 1, CURRENT_TIMESTAMP - INTERVAL '3 hours'
WHERE NOT EXISTS (
    SELECT 1 FROM mentorship_messages WHERE mentor_assignment_id = 1 AND suggestion_type = 'LIVE_CLASS'
);

INSERT INTO mentorship_messages (mentor_assignment_id, sender_id, message_text, suggestion_type, suggested_material_id, created_at)
SELECT 1, 3, 'Here is an essential study resource on Spring Boot Enterprise Architecture and Concurrency to review before our next sync.', 'MATERIAL', 2, CURRENT_TIMESTAMP - INTERVAL '1 hour'
WHERE NOT EXISTS (
    SELECT 1 FROM mentorship_messages WHERE mentor_assignment_id = 1 AND suggestion_type = 'MATERIAL'
);

INSERT INTO mentorship_messages (mentor_assignment_id, sender_id, message_text, suggestion_type, created_at)
SELECT 1, 4, 'Thanks Alex! I have registered for the Live Class and started reviewing the architecture guide.', 'NONE', CURRENT_TIMESTAMP - INTERVAL '20 minutes'
WHERE NOT EXISTS (
    SELECT 1 FROM mentorship_messages WHERE mentor_assignment_id = 1 AND sender_id = 4
);

-- 5. Seed actionable notifications for Employee Dashboard (David Kim, User 4)
INSERT INTO notifications (user_id, title, message, type, action_url, reference_id, sender_id, is_read, created_at)
SELECT 4, 'Live Class Suggested by Mentor Alex Morgan', 'Your mentor Alex Morgan suggested attending the live class "Mastering Spring Cloud & Microservice Mesh". Click to view details and join.', 'LIVE_CLASS_SUGGESTION', '/live-classes', 1, 3, FALSE, CURRENT_TIMESTAMP - INTERVAL '3 hours'
WHERE NOT EXISTS (
    SELECT 1 FROM notifications WHERE user_id = 4 AND type = 'LIVE_CLASS_SUGGESTION'
);

INSERT INTO notifications (user_id, title, message, type, action_url, reference_id, sender_id, is_read, created_at)
SELECT 4, 'Study Material Recommended by Mentor Alex Morgan', 'Your mentor Alex Morgan recommended reading "Spring Boot Enterprise Patterns & Cloud Architecture" to accelerate your Spring Boot mastery.', 'MATERIAL_SUGGESTION', '/weak-areas', 2, 3, FALSE, CURRENT_TIMESTAMP - INTERVAL '1 hour'
WHERE NOT EXISTS (
    SELECT 1 FROM notifications WHERE user_id = 4 AND type = 'MATERIAL_SUGGESTION'
);

SELECT setval('mentorship_messages_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM mentorship_messages), 1));
SELECT setval('notifications_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM notifications), 1));

