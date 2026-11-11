package com.orgkgi.repository;

import com.orgkgi.entity.CourseRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRecommendationRepository extends JpaRepository<CourseRecommendation, Long> {

    @Query("SELECT cr FROM CourseRecommendation cr " +
           "JOIN FETCH cr.course c " +
           "JOIN FETCH cr.recommendedBy rb " +
           "WHERE cr.employeeProfile.id = :profileId " +
           "ORDER BY cr.createdAt DESC")
    List<CourseRecommendation> findByEmployeeProfileIdWithDetails(@Param("profileId") Long profileId);

    boolean existsByEmployeeProfileIdAndCourseId(Long employeeProfileId, Long courseId);
}

