-- ==============================================================================
-- Flyway Migration: V20__replace_unavailable_video_links.sql
-- Description: Replace dead or unavailable video and course links with verified live URLs
-- ==============================================================================

-- 1. Ensure System Design course points to verified live YouTube course
UPDATE courses 
SET course_url = 'https://www.youtube.com/watch?v=m8Icp_Cid5o',
    provider = 'YouTube Learning'
WHERE id = 13;

-- 2. Ensure PostgreSQL bootcamp points to verified live Udemy course
UPDATE courses
SET course_url = 'https://www.udemy.com/course/the-complete-python-postgresql-developer-course/'
WHERE id = 11;

-- 3. Update course approval requests that may reference legacy or unavailable links
UPDATE course_approval_requests
SET external_course_url = 'https://www.udemy.com/course/the-complete-python-postgresql-developer-course/'
WHERE external_course_url LIKE '%udemy.com/course/postgresql-bootcamp%';

UPDATE course_approval_requests
SET external_course_url = 'https://www.youtube.com/watch?v=m8Icp_Cid5o'
WHERE external_course_url LIKE '%bUHFg8CZFCA%';

-- 4. Update live classes recordings to verified playable YouTube videos
UPDATE live_classes
SET recording_url = 'https://www.youtube.com/watch?v=0Lt9w-BxKFQ'
WHERE recording_url LIKE '%bUHFg8CZFCA%';

