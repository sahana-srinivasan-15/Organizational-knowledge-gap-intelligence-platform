package com.orgkgi.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "course_recommendations")
public class CourseRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_profile_id", nullable = false)
    private EmployeeProfile employeeProfile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recommended_by_id", nullable = false)
    private User recommendedBy;

    @Column(name = "recommended_by_role", nullable = false, length = 50)
    private String recommendedByRole;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public CourseRecommendation() {}

    public CourseRecommendation(EmployeeProfile employeeProfile, Course course, User recommendedBy, String recommendedByRole, String notes) {
        this.employeeProfile = employeeProfile;
        this.course = course;
        this.recommendedBy = recommendedBy;
        this.recommendedByRole = recommendedByRole;
        this.notes = notes;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public EmployeeProfile getEmployeeProfile() { return employeeProfile; }
    public void setEmployeeProfile(EmployeeProfile employeeProfile) { this.employeeProfile = employeeProfile; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public User getRecommendedBy() { return recommendedBy; }
    public void setRecommendedBy(User recommendedBy) { this.recommendedBy = recommendedBy; }

    public String getRecommendedByRole() { return recommendedByRole; }
    public void setRecommendedByRole(String recommendedByRole) { this.recommendedByRole = recommendedByRole; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}

