package com.orgkgi.repository;

import com.orgkgi.entity.TrainingPrediction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingPredictionRepository extends JpaRepository<TrainingPrediction, Long> {
    List<TrainingPrediction> findByEmployeeProfileIdOrderByCreatedAtDesc(Long employeeProfileId);
    Page<TrainingPrediction> findByEmployeeProfileId(Long employeeProfileId, Pageable pageable);
}
