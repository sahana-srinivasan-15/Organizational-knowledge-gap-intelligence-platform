package com.orgkgi.repository;

import com.orgkgi.entity.JobRoleSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRoleSkillRepository extends JpaRepository<JobRoleSkill, Long> {
    List<JobRoleSkill> findByJobRoleId(Long jobRoleId);
    Optional<JobRoleSkill> findByJobRoleIdAndSkillId(Long jobRoleId, Long skillId);
}
