package com.orgkgi.repository;

import com.orgkgi.entity.JobRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRoleRepository extends JpaRepository<JobRole, Long> {
    Optional<JobRole> findByCode(String code);
    List<JobRole> findByDepartmentId(Long departmentId);

    @Query("SELECT jr FROM JobRole jr LEFT JOIN FETCH jr.department WHERE (:departmentId IS NULL OR jr.department.id = :departmentId)")
    List<JobRole> findAllWithDepartment(@Param("departmentId") Long departmentId);
}
