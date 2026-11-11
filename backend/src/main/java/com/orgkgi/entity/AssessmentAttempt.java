package com.orgkgi.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "assessment_attempts")
public class AssessmentAttempt {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_profile_id", nullable = false)
    private EmployeeProfile employeeProfile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber = 1;

    @Column(nullable = false, length = 30)
    private String status = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED, EXPIRED, ABANDONED

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "question_ids_json", columnDefinition = "jsonb", nullable = false)
    private String questionIdsJson = "[]";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options_shuffled_json", columnDefinition = "jsonb")
    private String optionsShuffledJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "answers_submitted_json", columnDefinition = "jsonb")
    private String answersSubmittedJson;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    private Boolean passed;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions = 0;

    @Column(name = "correct_questions", nullable = false)
    private Integer correctQuestions = 0;

    @Column(name = "started_at", nullable = false)
    private OffsetDateTime startedAt = OffsetDateTime.now();

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public AssessmentAttempt() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public List<Long> parseQuestionIds() {
        if (questionIdsJson == null || questionIdsJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(questionIdsJson, new TypeReference<List<Long>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public void setQuestionIdsList(List<Long> ids) {
        try {
            this.questionIdsJson = MAPPER.writeValueAsString(ids != null ? ids : new ArrayList<>());
        } catch (Exception e) {
            this.questionIdsJson = "[]";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public EmployeeProfile getEmployeeProfile() { return employeeProfile; }
    public void setEmployeeProfile(EmployeeProfile employeeProfile) { this.employeeProfile = employeeProfile; }

    public Assessment getAssessment() { return assessment; }
    public void setAssessment(Assessment assessment) { this.assessment = assessment; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public Integer getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(Integer attemptNumber) { this.attemptNumber = attemptNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getQuestionIdsJson() { return questionIdsJson; }
    public void setQuestionIdsJson(String questionIdsJson) { this.questionIdsJson = questionIdsJson; }

    public String getOptionsShuffledJson() { return optionsShuffledJson; }
    public void setOptionsShuffledJson(String optionsShuffledJson) { this.optionsShuffledJson = optionsShuffledJson; }

    public String getAnswersSubmittedJson() { return answersSubmittedJson; }
    public void setAnswersSubmittedJson(String answersSubmittedJson) { this.answersSubmittedJson = answersSubmittedJson; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public Integer getCorrectQuestions() { return correctQuestions; }
    public void setCorrectQuestions(Integer correctQuestions) { this.correctQuestions = correctQuestions; }

    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
