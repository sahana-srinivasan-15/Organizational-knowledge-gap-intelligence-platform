package com.orgkgi.repository;

import com.orgkgi.entity.MentoringSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentoringSessionRepository extends JpaRepository<MentoringSession, Long> {

    List<MentoringSession> findByMentorAssignmentIdOrderBySessionDateDesc(Long mentorAssignmentId);

    List<MentoringSession> findByMentorAssignmentMentorIdOrderBySessionDateDesc(Long mentorProfileId);

    List<MentoringSession> findByMentorAssignmentMenteeIdOrderBySessionDateDesc(Long menteeProfileId);
}
