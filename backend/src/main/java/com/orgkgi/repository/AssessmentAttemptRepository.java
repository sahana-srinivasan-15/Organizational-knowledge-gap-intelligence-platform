package com.orgkgi.repository;

import com.orgkgi.entity.AssessmentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, Long> {

    List<AssessmentAttempt> findByEmployeeProfileIdAndCourseIdOrderByAttemptNumberDesc(Long employeeProfileId, Long courseId);

    List<AssessmentAttempt> findByEmployeeProfileIdAndAssessmentIdOrderByAttemptNumberDesc(Long employeeProfileId, Long assessmentId);

    List<AssessmentAttempt> findByEmployeeProfileIdOrderByCreatedAtDesc(Long employeeProfileId);

    long countByEmployeeProfileIdAndCourseId(Long employeeProfileId, Long courseId);

    long countByEmployeeProfileIdAndAssessmentId(Long employeeProfileId, Long assessmentId);

    Optional<AssessmentAttempt> findTopByEmployeeProfileIdAndCourseIdOrderByAttemptNumberDesc(Long employeeProfileId, Long courseId);

    Optional<AssessmentAttempt> findTopByEmployeeProfileIdAndAssessmentIdOrderByAttemptNumberDesc(Long employeeProfileId, Long assessmentId);

    long countByEmployeeProfileIdAndPassedTrue(Long employeeProfileId);

    boolean existsByEmployeeProfileIdAndPassedTrue(Long employeeProfileId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(a) > 0 FROM AssessmentAttempt a WHERE a.employeeProfile.id = :profileId AND (a.passed = true OR a.score >= 70.0)")
    boolean hasPassedOrHighScoringAttempt(@org.springframework.data.repository.query.Param("profileId") Long profileId);
}
