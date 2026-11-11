package com.orgkgi.repository;

import com.orgkgi.entity.MentorshipMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentorshipMessageRepository extends JpaRepository<MentorshipMessage, Long> {

    List<MentorshipMessage> findByMentorAssignmentIdOrderByCreatedAtAsc(Long mentorAssignmentId);
}

