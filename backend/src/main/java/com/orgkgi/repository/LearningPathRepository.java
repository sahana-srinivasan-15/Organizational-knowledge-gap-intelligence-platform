package com.orgkgi.repository;

import com.orgkgi.entity.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, Long> {
    List<LearningPath> findByEmployeeProfileId(Long employeeProfileId);
    Optional<LearningPath> findByEmployeeProfileIdAndStatus(Long employeeProfileId, String status);
    List<LearningPath> findByEmployeeProfileIdOrderByCreatedAtDesc(Long employeeProfileId);
}
