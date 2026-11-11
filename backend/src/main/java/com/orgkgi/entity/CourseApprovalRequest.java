package com.orgkgi.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "course_approval_requests")
public class CourseApprovalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_profile_id", nullable = false)
    private EmployeeProfile employeeProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(name = "external_course_title", nullable = false, length = 255)
    private String externalCourseTitle;

    @Column(name = "external_course_provider", nullable = false, length = 100)
    private String externalCourseProvider;

    @Column(name = "external_course_url", length = 500)
    private String externalCourseUrl;

    @Column(precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "duration_hours")
    private Integer durationHours = 10;

    @Column(name = "difficulty_level", length = 30)
    private String difficultyLevel = "BEGINNER";

    @Column(precision = 3, scale = 2)
    private BigDecimal rating = new BigDecimal("4.50");

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_skill_id")
    private Skill targetSkill;

    @Column(name = "target_skill_name", length = 100)
    private String targetSkillName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(name = "expected_outcome", columnDefinition = "TEXT")
    private String expectedOutcome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CourseRequestPriority priority = CourseRequestPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CourseApprovalStatus status = CourseApprovalStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(name = "manager_comment", columnDefinition = "TEXT")
    private String managerComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alternative_course_id")
    private Course alternativeCourse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommended_mentor_id")
    private EmployeeProfile recommendedMentor;

    @Column(name = "target_completion_date")
    private LocalDate targetCompletionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learning_path_id")
    private LearningPath learningPath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learning_path_course_id")
    private LearningPathCourse learningPathCourse;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    public CourseApprovalRequest() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public EmployeeProfile getEmployeeProfile() { return employeeProfile; }
    public void setEmployeeProfile(EmployeeProfile employeeProfile) { this.employeeProfile = employeeProfile; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public String getExternalCourseTitle() { return externalCourseTitle; }
    public void setExternalCourseTitle(String externalCourseTitle) { this.externalCourseTitle = externalCourseTitle; }

    public String getExternalCourseProvider() { return externalCourseProvider; }
    public void setExternalCourseProvider(String externalCourseProvider) { this.externalCourseProvider = externalCourseProvider; }

    public String getExternalCourseUrl() { return externalCourseUrl; }
    public void setExternalCourseUrl(String externalCourseUrl) { this.externalCourseUrl = externalCourseUrl; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Integer getDurationHours() { return durationHours; }
    public void setDurationHours(Integer durationHours) { this.durationHours = durationHours; }

    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public Skill getTargetSkill() { return targetSkill; }
    public void setTargetSkill(Skill targetSkill) { this.targetSkill = targetSkill; }

    public String getTargetSkillName() { return targetSkillName; }
    public void setTargetSkillName(String targetSkillName) { this.targetSkillName = targetSkillName; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getExpectedOutcome() { return expectedOutcome; }
    public void setExpectedOutcome(String expectedOutcome) { this.expectedOutcome = expectedOutcome; }

    public CourseRequestPriority getPriority() { return priority; }
    public void setPriority(CourseRequestPriority priority) { this.priority = priority; }

    public CourseApprovalStatus getStatus() { return status; }
    public void setStatus(CourseApprovalStatus status) { this.status = status; }

    public User getManager() { return manager; }
    public void setManager(User manager) { this.manager = manager; }

    public String getManagerComment() { return managerComment; }
    public void setManagerComment(String managerComment) { this.managerComment = managerComment; }

    public Course getAlternativeCourse() { return alternativeCourse; }
    public void setAlternativeCourse(Course alternativeCourse) { this.alternativeCourse = alternativeCourse; }

    public EmployeeProfile getRecommendedMentor() { return recommendedMentor; }
    public void setRecommendedMentor(EmployeeProfile recommendedMentor) { this.recommendedMentor = recommendedMentor; }

    public LocalDate getTargetCompletionDate() { return targetCompletionDate; }
    public void setTargetCompletionDate(LocalDate targetCompletionDate) { this.targetCompletionDate = targetCompletionDate; }

    public LearningPath getLearningPath() { return learningPath; }
    public void setLearningPath(LearningPath learningPath) { this.learningPath = learningPath; }

    public LearningPathCourse getLearningPathCourse() { return learningPathCourse; }
    public void setLearningPathCourse(LearningPathCourse learningPathCourse) { this.learningPathCourse = learningPathCourse; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public OffsetDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(OffsetDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
