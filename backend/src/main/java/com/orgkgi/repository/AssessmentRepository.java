package com.orgkgi.repository;

import com.orgkgi.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findBySkillId(Long skillId);
    Optional<Assessment> findByCourseId(Long courseId);
    List<Assessment> findByCourseIdIn(List<Long> courseIds);
}
