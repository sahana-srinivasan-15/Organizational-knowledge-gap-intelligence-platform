package com.orgkgi.repository;

import com.orgkgi.entity.LearningMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningMilestoneRepository extends JpaRepository<LearningMilestone, Long> {

    List<LearningMilestone> findByMentorAssignmentIdOrderByTargetDateAsc(Long mentorAssignmentId);

    List<LearningMilestone> findByLearningPathCourseIdOrderByTargetDateAsc(Long learningPathCourseId);

    List<LearningMilestone> findByMentorAssignmentMentorIdOrderByTargetDateAsc(Long mentorProfileId);

    List<LearningMilestone> findByMentorAssignmentMenteeIdOrderByTargetDateAsc(Long menteeProfileId);
}
