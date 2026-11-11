package com.orgkgi.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "job_role_skills",
    uniqueConstraints = @UniqueConstraint(name = "uq_role_skill", columnNames = {"job_role_id", "skill_id"})
)
public class JobRoleSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_role_id", nullable = false)
    private JobRole jobRole;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Column(name = "required_proficiency_level", nullable = false)
    private Integer requiredProficiencyLevel;

    @Column(name = "importance_weight", nullable = false, precision = 3, scale = 1)
    private BigDecimal importanceWeight = BigDecimal.valueOf(1.0);

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public JobRoleSkill() {}

    public JobRoleSkill(JobRole jobRole, Skill skill, Integer requiredProficiencyLevel, BigDecimal importanceWeight) {
        this.jobRole = jobRole;
        this.skill = skill;
        this.requiredProficiencyLevel = requiredProficiencyLevel;
        this.importanceWeight = importanceWeight;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public JobRole getJobRole() { return jobRole; }
    public void setJobRole(JobRole jobRole) { this.jobRole = jobRole; }

    public Skill getSkill() { return skill; }
    public void setSkill(Skill skill) { this.skill = skill; }

    public Integer getRequiredProficiencyLevel() { return requiredProficiencyLevel; }
    public void setRequiredProficiencyLevel(Integer requiredProficiencyLevel) { this.requiredProficiencyLevel = requiredProficiencyLevel; }

    public BigDecimal getImportanceWeight() { return importanceWeight; }
    public void setImportanceWeight(BigDecimal importanceWeight) { this.importanceWeight = importanceWeight; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
