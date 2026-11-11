package com.orgkgi.repository;

import com.orgkgi.entity.AssessmentQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestion, Long> {
    List<AssessmentQuestion> findByAssessmentIdOrderByIdAsc(Long assessmentId);
    List<AssessmentQuestion> findByCourseIdOrderByIdAsc(Long courseId);
    List<AssessmentQuestion> findByAssessmentIdOrCourseIdOrderByIdAsc(Long assessmentId, Long courseId);
    long countByAssessmentId(Long assessmentId);
    long countByCourseId(Long courseId);
}
