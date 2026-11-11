package com.orgkgi.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "course_skills",
    uniqueConstraints = @UniqueConstraint(name = "uq_course_skill", columnNames = {"course_id", "skill_id"})
)
public class CourseSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Column(name = "target_proficiency_gain", nullable = false)
    private Integer targetProficiencyGain = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public CourseSkill() {}

    public CourseSkill(Course course, Skill skill, Integer targetProficiencyGain) {
        this.course = course;
        this.skill = skill;
        this.targetProficiencyGain = targetProficiencyGain;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public Skill getSkill() { return skill; }
    public void setSkill(Skill skill) { this.skill = skill; }

    public Integer getTargetProficiencyGain() { return targetProficiencyGain; }
    public void setTargetProficiencyGain(Integer targetProficiencyGain) { this.targetProficiencyGain = targetProficiencyGain; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
