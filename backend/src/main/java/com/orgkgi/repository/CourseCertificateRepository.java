package com.orgkgi.repository;

import com.orgkgi.entity.CourseCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseCertificateRepository extends JpaRepository<CourseCertificate, Long> {

    List<CourseCertificate> findByEmployeeProfileIdOrderByCreatedAtDesc(Long employeeProfileId);

    Optional<CourseCertificate> findByEmployeeProfileIdAndCourseSlug(Long employeeProfileId, String courseSlug);

    Optional<CourseCertificate> findByEmployeeProfileIdAndCourseTitleIgnoreCase(Long employeeProfileId, String courseTitle);

    long countByEmployeeProfileId(Long employeeProfileId);

    boolean existsByEmployeeProfileId(Long employeeProfileId);
}

