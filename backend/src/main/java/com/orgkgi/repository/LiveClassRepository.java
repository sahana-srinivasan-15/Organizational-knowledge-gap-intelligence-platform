package com.orgkgi.repository;

import com.orgkgi.entity.LiveClass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LiveClassRepository extends JpaRepository<LiveClass, Long> {

    List<LiveClass> findByMentorIdOrderByScheduledAtDesc(Long mentorProfileId);

    List<LiveClass> findByStatusOrderByScheduledAtAsc(String status);

    @Query("SELECT lc FROM LiveClass lc WHERE (:status IS NULL OR lc.status = :status) " +
           "AND (:skillId IS NULL OR lc.skill.id = :skillId) ORDER BY " +
           "CASE WHEN lc.status = 'LIVE' THEN 1 WHEN lc.status = 'UPCOMING' THEN 2 ELSE 3 END, " +
           "lc.scheduledAt ASC")
    List<LiveClass> findFilteredClasses(@Param("status") String status, @Param("skillId") Long skillId);

    @Query("SELECT lc FROM LiveClass lc ORDER BY " +
           "CASE WHEN lc.status = 'LIVE' THEN 1 WHEN lc.status = 'UPCOMING' THEN 2 ELSE 3 END, " +
           "lc.scheduledAt ASC")
    List<LiveClass> findAllOrdered();
}

