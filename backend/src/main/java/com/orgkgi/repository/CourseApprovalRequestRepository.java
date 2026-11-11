package com.orgkgi.repository;

import com.orgkgi.entity.CourseApprovalRequest;
import com.orgkgi.entity.CourseApprovalStatus;
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
public interface CourseApprovalRequestRepository extends JpaRepository<CourseApprovalRequest, Long> {

    List<CourseApprovalRequest> findByEmployeeProfileIdOrderByCreatedAtDesc(Long employeeProfileId);

    List<CourseApprovalRequest> findByEmployeeProfileIdAndStatus(Long employeeProfileId, CourseApprovalStatus status);

    List<CourseApprovalRequest> findByEmployeeProfileIdAndStatusIn(Long employeeProfileId, Collection<CourseApprovalStatus> statuses);

    boolean existsByEmployeeProfileIdAndExternalCourseTitleIgnoreCaseAndStatusIn(
            Long employeeProfileId, String externalCourseTitle, Collection<CourseApprovalStatus> statuses);

    @Query("SELECT r FROM CourseApprovalRequest r " +
           "WHERE (:status IS NULL OR r.status = :status) " +
           "AND (:departmentId IS NULL OR r.employeeProfile.user.department.id = :departmentId) " +
           "AND (:employeeProfileId IS NULL OR r.employeeProfile.id = :employeeProfileId) " +
           "ORDER BY r.createdAt DESC")
    Page<CourseApprovalRequest> findRequestsFiltered(
            @Param("status") CourseApprovalStatus status,
            @Param("departmentId") Long departmentId,
            @Param("employeeProfileId") Long employeeProfileId,
            Pageable pageable);

    @Query("SELECT COUNT(r) FROM CourseApprovalRequest r " +
           "WHERE r.employeeProfile.user.department.id = :departmentId " +
           "AND r.status = :status")
    long countByDepartmentIdAndStatus(
            @Param("departmentId") Long departmentId,
            @Param("status") CourseApprovalStatus status);

    @Query("SELECT COUNT(r) FROM CourseApprovalRequest r " +
           "WHERE r.employeeProfile.user.department.id = :departmentId")
    long countByDepartmentId(@Param("departmentId") Long departmentId);
}
