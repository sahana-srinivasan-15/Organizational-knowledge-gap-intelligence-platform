package com.orgkgi.repository;

import com.orgkgi.entity.LearningPathCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LearningPathCourseRepository extends JpaRepository<LearningPathCourse, Long> {
    List<LearningPathCourse> findByLearningPathIdOrderByStepOrderAsc(Long learningPathId);
    Optional<LearningPathCourse> findByLearningPathIdAndCourseId(Long learningPathId, Long courseId);

    @Query("SELECT lpc FROM LearningPathCourse lpc JOIN FETCH lpc.course WHERE lpc.learningPath.id = :pathId ORDER BY lpc.stepOrder ASC")
    List<LearningPathCourse> findByLearningPathIdWithCourse(@Param("pathId") Long pathId);

    @Query("SELECT COUNT(lpc) > 0 FROM LearningPathCourse lpc WHERE lpc.learningPath.employeeProfile.id = :profileId AND lpc.course.id = :courseId AND lpc.status = 'COMPLETED'")
    boolean isCourseCompletedByEmployee(@Param("profileId") Long profileId, @Param("courseId") Long courseId);

    @Query("SELECT COUNT(lpc) > 0 FROM LearningPathCourse lpc WHERE lpc.learningPath.employeeProfile.id = :profileId AND lpc.status = 'COMPLETED'")
    boolean hasCompletedCoursesByEmployee(@Param("profileId") Long profileId);

    @Query("SELECT COUNT(lpc) FROM LearningPathCourse lpc WHERE lpc.learningPath.employeeProfile.id = :profileId AND lpc.status = 'COMPLETED'")
    long countCompletedCoursesByEmployee(@Param("profileId") Long profileId);
}
