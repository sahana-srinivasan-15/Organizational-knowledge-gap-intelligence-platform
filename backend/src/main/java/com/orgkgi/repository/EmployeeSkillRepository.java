package com.orgkgi.repository;

import com.orgkgi.entity.EmployeeSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeSkillRepository extends JpaRepository<EmployeeSkill, Long> {
    List<EmployeeSkill> findByEmployeeProfileId(Long employeeProfileId);
    Optional<EmployeeSkill> findByEmployeeProfileIdAndSkillId(Long employeeProfileId, Long skillId);
}
