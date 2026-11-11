package com.orgkgi.repository;

import com.orgkgi.entity.SkillMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillMaterialRepository extends JpaRepository<SkillMaterial, Long> {

    List<SkillMaterial> findBySkillIdOrderByDifficultyLevelAsc(Long skillId);

    List<SkillMaterial> findBySkillIdIn(List<Long> skillIds);
}

