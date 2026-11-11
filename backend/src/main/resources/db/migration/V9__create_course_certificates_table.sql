-- ==============================================================================
-- Flyway Migration: V9__create_course_certificates_table.sql
-- Description: Stores employee course completion certificates (PDF/Images/URLs)
-- ==============================================================================

CREATE TABLE course_certificates (
    id BIGSERIAL PRIMARY KEY,
    employee_profile_id BIGINT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    course_title VARCHAR(255) NOT NULL,
    course_provider VARCHAR(100),
    course_slug VARCHAR(255),
    certificate_file_name VARCHAR(255),
    certificate_file_path VARCHAR(500),
    credential_url VARCHAR(500),
    completion_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_cert_profile ON course_certificates(employee_profile_id);
CREATE INDEX idx_cert_slug ON course_certificates(course_slug);
CREATE INDEX idx_cert_title ON course_certificates(course_title);

