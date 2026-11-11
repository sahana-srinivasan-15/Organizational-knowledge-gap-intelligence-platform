package com.orgkgi.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "employee_profiles")
public class EmployeeProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_job_role_id")
    private JobRole currentJobRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_job_role_id")
    private JobRole targetJobRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "mentor_opt_in", nullable = false)
    private Boolean mentorOptIn = false;

    @Column(name = "mentor_availability_hrs_per_week", nullable = false)
    private Integer mentorAvailabilityHrsPerWeek = 0;

    @Column(name = "current_mentee_count", nullable = false)
    private Integer currentMenteeCount = 0;

    @Column(name = "max_mentees", nullable = false)
    private Integer maxMentees = 3;

    @OneToMany(mappedBy = "employeeProfile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<EmployeeSkill> employeeSkills = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public EmployeeProfile() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public boolean isEligibleForMentorship() {
        return Boolean.TRUE.equals(mentorOptIn) &&
               mentorAvailabilityHrsPerWeek != null && mentorAvailabilityHrsPerWeek > 0 &&
               maxMentees != null && maxMentees > 0 &&
               (currentMenteeCount == null || currentMenteeCount < maxMentees);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public JobRole getCurrentJobRole() { return currentJobRole; }
    public void setCurrentJobRole(JobRole currentJobRole) { this.currentJobRole = currentJobRole; }

    public JobRole getTargetJobRole() { return targetJobRole; }
    public void setTargetJobRole(JobRole targetJobRole) { this.targetJobRole = targetJobRole; }

    public User getManager() { return manager; }
    public void setManager(User manager) { this.manager = manager; }

    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }

    public Boolean getMentorOptIn() { return mentorOptIn; }
    public void setMentorOptIn(Boolean mentorOptIn) { this.mentorOptIn = mentorOptIn; }

    public Integer getMentorAvailabilityHrsPerWeek() { return mentorAvailabilityHrsPerWeek; }
    public void setMentorAvailabilityHrsPerWeek(Integer mentorAvailabilityHrsPerWeek) { this.mentorAvailabilityHrsPerWeek = mentorAvailabilityHrsPerWeek; }

    public Integer getCurrentMenteeCount() { return currentMenteeCount; }
    public void setCurrentMenteeCount(Integer currentMenteeCount) { this.currentMenteeCount = currentMenteeCount; }

    public Integer getMaxMentees() { return maxMentees; }
    public void setMaxMentees(Integer maxMentees) { this.maxMentees = maxMentees; }

    @Column(name = "resume_file_name")
    private String resumeFileName;

    @Column(name = "resume_file_path")
    private String resumeFilePath;

    @Column(name = "resume_content_type")
    private String resumeContentType;

    @Column(name = "resume_file_size")
    private Long resumeFileSize;

    @Column(name = "resume_uploaded_at")
    private OffsetDateTime resumeUploadedAt;

    public List<EmployeeSkill> getEmployeeSkills() { return employeeSkills; }
    public void setEmployeeSkills(List<EmployeeSkill> employeeSkills) { this.employeeSkills = employeeSkills; }

    public String getResumeFileName() { return resumeFileName; }
    public void setResumeFileName(String resumeFileName) { this.resumeFileName = resumeFileName; }

    public String getResumeFilePath() { return resumeFilePath; }
    public void setResumeFilePath(String resumeFilePath) { this.resumeFilePath = resumeFilePath; }

    public String getResumeContentType() { return resumeContentType; }
    public void setResumeContentType(String resumeContentType) { this.resumeContentType = resumeContentType; }

    public Long getResumeFileSize() { return resumeFileSize; }
    public void setResumeFileSize(Long resumeFileSize) { this.resumeFileSize = resumeFileSize; }

    public OffsetDateTime getResumeUploadedAt() { return resumeUploadedAt; }
    public void setResumeUploadedAt(OffsetDateTime resumeUploadedAt) { this.resumeUploadedAt = resumeUploadedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
