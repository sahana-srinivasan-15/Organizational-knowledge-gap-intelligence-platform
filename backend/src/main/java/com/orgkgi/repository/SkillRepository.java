package com.orgkgi.repository;

import com.orgkgi.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findByCode(String code);
    Optional<Skill> findByName(String name);
    List<Skill> findByCategoryId(Long categoryId);
}
