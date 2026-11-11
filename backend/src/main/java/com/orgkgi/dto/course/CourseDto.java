package com.orgkgi.dto.course;

import java.math.BigDecimal;
import java.util.List;

public class CourseDto {
    private Long id;
    private String title;
    private String provider;
    private Integer durationHours;
    private String difficultyLevel;
    private BigDecimal rating;
    private String courseUrl;
    private String description;
    private List<CourseSkillGainDto> skillsCovered;

    public CourseDto() {}

    public CourseDto(Long id, String title, String provider, Integer durationHours, String difficultyLevel, BigDecimal rating, String courseUrl, String description, List<CourseSkillGainDto> skillsCovered) {
        this.id = id;
        this.title = title;
        this.provider = provider;
        this.durationHours = durationHours;
        this.difficultyLevel = difficultyLevel;
        this.rating = rating;
        this.courseUrl = courseUrl;
        this.description = description;
        this.skillsCovered = skillsCovered;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public Integer getDurationHours() { return durationHours; }
    public void setDurationHours(Integer durationHours) { this.durationHours = durationHours; }

    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public String getCourseUrl() { return courseUrl; }
    public void setCourseUrl(String courseUrl) { this.courseUrl = courseUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<CourseSkillGainDto> getSkillsCovered() { return skillsCovered; }
    public void setSkillsCovered(List<CourseSkillGainDto> skillsCovered) { this.skillsCovered = skillsCovered; }
}
