package com.orgkgi.repository;

import com.orgkgi.entity.WeakAreaReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WeakAreaReviewRepository extends JpaRepository<WeakAreaReview, Long> {

    List<WeakAreaReview> findByEmployeeProfileIdOrderByCreatedAtDesc(Long employeeProfileId);

    List<WeakAreaReview> findByEmployeeProfileIdAndSkillIdOrderByCreatedAtDesc(Long employeeProfileId, Long skillId);

    Optional<WeakAreaReview> findFirstByEmployeeProfileIdAndSkillIdOrderByCreatedAtDesc(Long employeeProfileId, Long skillId);
}

