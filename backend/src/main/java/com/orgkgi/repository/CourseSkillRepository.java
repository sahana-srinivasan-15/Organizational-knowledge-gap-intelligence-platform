package com.orgkgi.repository;

import com.orgkgi.entity.CourseSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseSkillRepository extends JpaRepository<CourseSkill, Long> {
    List<CourseSkill> findByCourseId(Long courseId);
    List<CourseSkill> findBySkillId(Long skillId);

    @Query("SELECT cs FROM CourseSkill cs JOIN FETCH cs.course JOIN FETCH cs.skill")
    List<CourseSkill> findAllWithCourseAndSkill();
}
