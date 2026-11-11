package com.orgkgi.repository;

import com.orgkgi.entity.AssessmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentSubmissionRepository extends JpaRepository<AssessmentSubmission, Long> {
    List<AssessmentSubmission> findByEmployeeProfileIdOrderByAttemptedAtDesc(Long employeeProfileId);
    List<AssessmentSubmission> findByEmployeeProfileIdAndCourseIdOrderByAttemptedAtDesc(Long employeeProfileId, Long courseId);
    long countByEmployeeProfileIdAndPassedTrue(Long employeeProfileId);
    boolean existsByEmployeeProfileIdAndPassedTrue(Long employeeProfileId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) > 0 FROM AssessmentSubmission s WHERE s.employeeProfile.id = :profileId AND (s.passed = true OR s.score >= 70.0)")
    boolean hasPassedOrHighScoringSubmission(@org.springframework.data.repository.query.Param("profileId") Long profileId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) FROM AssessmentSubmission s WHERE s.employeeProfile.id = :profileId AND (s.passed = true OR s.score >= 70.0)")
    long countPassedOrHighScoringSubmissions(@org.springframework.data.repository.query.Param("profileId") Long profileId);
}
