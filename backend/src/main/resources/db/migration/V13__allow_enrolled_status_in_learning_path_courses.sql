-- V13: Allow ENROLLED status in learning_path_courses table
ALTER TABLE learning_path_courses DROP CONSTRAINT IF EXISTS learning_path_courses_status_check;
ALTER TABLE learning_path_courses ADD CONSTRAINT learning_path_courses_status_check 
    CHECK (status IN ('NOT_STARTED', 'ENROLLED', 'IN_PROGRESS', 'COMPLETED'));

