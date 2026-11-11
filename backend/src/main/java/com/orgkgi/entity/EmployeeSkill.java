package com.orgkgi.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "employee_skills",
    uniqueConstraints = @UniqueConstraint(name = "uq_employee_skill", columnNames = {"employee_profile_id", "skill_id"})
)
public class EmployeeSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_profile_id", nullable = false)
    private EmployeeProfile employeeProfile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Column(name = "current_proficiency_level", nullable = false)
    private Integer currentProficiencyLevel;

    @Column(name = "verified_proficiency_level", nullable = false)
    private Integer verifiedProficiencyLevel = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 30)
    private VerificationStatus verificationStatus = VerificationStatus.SELF_REPORTED;

    @Column(name = "last_assessed_at")
    private OffsetDateTime lastAssessedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public EmployeeSkill() {}

    public EmployeeSkill(EmployeeProfile employeeProfile, Skill skill, Integer currentProficiencyLevel, Integer verifiedProficiencyLevel, VerificationStatus verificationStatus) {
        this.employeeProfile = employeeProfile;
        this.skill = skill;
        this.currentProficiencyLevel = currentProficiencyLevel;
        this.verifiedProficiencyLevel = verifiedProficiencyLevel;
        this.verificationStatus = verificationStatus;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public EmployeeProfile getEmployeeProfile() { return employeeProfile; }
    public void setEmployeeProfile(EmployeeProfile employeeProfile) { this.employeeProfile = employeeProfile; }

    public Skill getSkill() { return skill; }
    public void setSkill(Skill skill) { this.skill = skill; }

    public Integer getCurrentProficiencyLevel() { return currentProficiencyLevel; }
    public void setCurrentProficiencyLevel(Integer currentProficiencyLevel) { this.currentProficiencyLevel = currentProficiencyLevel; }

    public Integer getVerifiedProficiencyLevel() { return verifiedProficiencyLevel; }
    public void setVerifiedProficiencyLevel(Integer verifiedProficiencyLevel) { this.verifiedProficiencyLevel = verifiedProficiencyLevel; }

    public VerificationStatus getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(VerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }

    public OffsetDateTime getLastAssessedAt() { return lastAssessedAt; }
    public void setLastAssessedAt(OffsetDateTime lastAssessedAt) { this.lastAssessedAt = lastAssessedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
