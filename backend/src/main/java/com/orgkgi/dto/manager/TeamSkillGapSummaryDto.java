package com.orgkgi.dto.manager;

public class TeamSkillGapSummaryDto {

    private Long skillId;
    private String skillName;
    private String skillCode;
    private String categoryName;
    private int affectedEmployeesCount;
    private double averageGapMagnitude;
    private String priorityLevel; // HIGH, MEDIUM, LOW
    private String recommendedCourseTitle;
    private Long recommendedCourseId;
    private String recommendedMentorName;
    private Long recommendedMentorId;

    public TeamSkillGapSummaryDto() {}

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getSkillCode() { return skillCode; }
    public void setSkillCode(String skillCode) { this.skillCode = skillCode; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public int getAffectedEmployeesCount() { return affectedEmployeesCount; }
    public void setAffectedEmployeesCount(int affectedEmployeesCount) { this.affectedEmployeesCount = affectedEmployeesCount; }

    public double getAverageGapMagnitude() { return averageGapMagnitude; }
    public void setAverageGapMagnitude(double averageGapMagnitude) { this.averageGapMagnitude = averageGapMagnitude; }

    public String getPriorityLevel() { return priorityLevel; }
    public void setPriorityLevel(String priorityLevel) { this.priorityLevel = priorityLevel; }

    public String getRecommendedCourseTitle() { return recommendedCourseTitle; }
    public void setRecommendedCourseTitle(String recommendedCourseTitle) { this.recommendedCourseTitle = recommendedCourseTitle; }

    public Long getRecommendedCourseId() { return recommendedCourseId; }
    public void setRecommendedCourseId(Long recommendedCourseId) { this.recommendedCourseId = recommendedCourseId; }

    public String getRecommendedMentorName() { return recommendedMentorName; }
    public void setRecommendedMentorName(String recommendedMentorName) { this.recommendedMentorName = recommendedMentorName; }

    public Long getRecommendedMentorId() { return recommendedMentorId; }
    public void setRecommendedMentorId(Long recommendedMentorId) { this.recommendedMentorId = recommendedMentorId; }
}
