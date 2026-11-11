package com.orgkgi.repository;

import com.orgkgi.entity.EmployeeProfile;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeProfileRepository extends JpaRepository<EmployeeProfile, Long> {

    Optional<EmployeeProfile> findByUserId(Long userId);

    List<EmployeeProfile> findByManagerId(Long managerId);

    @Query("SELECT ep FROM EmployeeProfile ep WHERE ep.user.department.id = :departmentId")
    List<EmployeeProfile> findByDepartmentId(@Param("departmentId") Long departmentId);

    @Query("SELECT ep FROM EmployeeProfile ep WHERE ep.mentorOptIn = true AND ep.mentorAvailabilityHrsPerWeek > 0 AND ep.currentMenteeCount < ep.maxMentees")
    List<EmployeeProfile> findAvailableMentorCandidates();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ep FROM EmployeeProfile ep WHERE ep.id = :id")
    Optional<EmployeeProfile> findByIdWithPessimisticLock(@Param("id") Long id);
}
