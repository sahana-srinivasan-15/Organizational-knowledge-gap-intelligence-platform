package com.orgkgi.dto.discovery;

import java.math.BigDecimal;
import java.util.List;

public class ExternalCourseDto {

    private Long id;
    private String title;
    private String provider; // Coursera, Udemy, edX, YouTube Learning, Internal Academy
    private String courseUrl;
    private String description;
    private String instructor;
    private BigDecimal price; // 0.00 for free
    private Boolean isFree;
    private BigDecimal rating;
    private Integer reviewCount;
    private Integer durationHours;
    private String difficultyLevel; // BEGINNER, INTERMEDIATE, ADVANCED
    private Boolean certificateAvailable;
    private String language;
    private List<String> skillsCovered;
    private Double matchRelevanceScore; // Dynamic match against employee skill gap
    private String recommendationReason; // Transparent explanation
    private boolean isRecommended;

    public ExternalCourseDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getCourseUrl() { return courseUrl; }
    public void setCourseUrl(String courseUrl) { this.courseUrl = courseUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getInstructor() { return instructor; }
    public void setInstructor(String instructor) { this.instructor = instructor; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Boolean getIsFree() { return isFree; }
    public void setIsFree(Boolean free) { isFree = free; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public Integer getReviewCount() { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }

    public Integer getDurationHours() { return durationHours; }
    public void setDurationHours(Integer durationHours) { this.durationHours = durationHours; }

    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public Boolean getCertificateAvailable() { return certificateAvailable; }
    public void setCertificateAvailable(Boolean certificateAvailable) { this.certificateAvailable = certificateAvailable; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public List<String> getSkillsCovered() { return skillsCovered; }
    public void setSkillsCovered(List<String> skillsCovered) { this.skillsCovered = skillsCovered; }

    public Double getMatchRelevanceScore() { return matchRelevanceScore; }
    public void setMatchRelevanceScore(Double matchRelevanceScore) { this.matchRelevanceScore = matchRelevanceScore; }

    public String getRecommendationReason() { return recommendationReason; }
    public void setRecommendationReason(String recommendationReason) { this.recommendationReason = recommendationReason; }

    public boolean isRecommended() { return isRecommended; }
    public void setRecommended(boolean recommended) { isRecommended = recommended; }
}
