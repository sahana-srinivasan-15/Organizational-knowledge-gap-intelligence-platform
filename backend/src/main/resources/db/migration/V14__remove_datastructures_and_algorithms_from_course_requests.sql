-- ==============================================================================
-- Flyway Migration: V14__remove_datastructures_and_algorithms_from_course_requests.sql
-- Description: Remove Data Structures and Algorithms request from course_approval_requests.
-- ==============================================================================

DELETE FROM course_approval_requests 
WHERE id = 3 
   OR LOWER(external_course_title) LIKE '%data structures%' 
   OR LOWER(external_course_title) LIKE '%algorithm%';

