package com.orgkgi.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "learning_milestones")
public class LearningMilestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_assignment_id")
    private MentorAssignment mentorAssignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learning_path_course_id")
    private LearningPathCourse learningPathCourse;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "completed_date")
    private LocalDate completedDate;

    @Column(nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED, OVERDUE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdByUser;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public LearningMilestone() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public MentorAssignment getMentorAssignment() { return mentorAssignment; }
    public void setMentorAssignment(MentorAssignment mentorAssignment) { this.mentorAssignment = mentorAssignment; }

    public LearningPathCourse getLearningPathCourse() { return learningPathCourse; }
    public void setLearningPathCourse(LearningPathCourse learningPathCourse) { this.learningPathCourse = learningPathCourse; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }

    public LocalDate getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public User getCreatedByUser() { return createdByUser; }
    public void setCreatedByUser(User createdByUser) { this.createdByUser = createdByUser; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
