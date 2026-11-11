package com.orgkgi.repository;

import com.orgkgi.entity.MentorAssignment;
import com.orgkgi.entity.MentorAssignmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface MentorAssignmentRepository extends JpaRepository<MentorAssignment, Long> {

    List<MentorAssignment> findByMenteeId(Long menteeId);

    List<MentorAssignment> findByMentorId(Long mentorId);

    List<MentorAssignment> findByMenteeIdAndStatus(Long menteeId, MentorAssignmentStatus status);

    List<MentorAssignment> findByMentorIdAndStatus(Long mentorId, MentorAssignmentStatus status);

    Optional<MentorAssignment> findByMenteeIdAndMentorIdAndSkillIdAndStatusIn(
            Long menteeId, Long mentorId, Long skillId, Collection<MentorAssignmentStatus> statuses);

    @Query("SELECT ma FROM MentorAssignment ma " +
           "WHERE (:status IS NULL OR ma.status = :status) " +
           "AND (:menteeId IS NULL OR ma.mentee.id = :menteeId) " +
           "AND (:mentorId IS NULL OR ma.mentor.id = :mentorId) " +
           "AND (:departmentId IS NULL OR ma.mentee.user.department.id = :departmentId)")
    Page<MentorAssignment> findAssignmentsFiltered(
            @Param("status") MentorAssignmentStatus status,
            @Param("menteeId") Long menteeId,
            @Param("mentorId") Long mentorId,
            @Param("departmentId") Long departmentId,
            Pageable pageable);

    @Query("SELECT ma FROM MentorAssignment ma " +
           "WHERE (:status IS NULL OR ma.status = :status) " +
           "AND (ma.mentee.id = :profileId OR ma.mentor.id = :profileId)")
    Page<MentorAssignment> findByMenteeOrMentor(
            @Param("profileId") Long profileId,
            @Param("status") MentorAssignmentStatus status,
            Pageable pageable);
}
