package com.orgkgi.dto.course;

import java.math.BigDecimal;
import java.util.List;

public class CourseRecommendationDto {
    private CourseDto course;
    private BigDecimal recommendationScore;
    private List<String> skillGapsCovered;
    private String primaryTargetSkill;
    private int totalProficiencyGain;
    private String explanation;
    private int matchRank;
    private String recommendedByRole;
    private String recommendedByName;
    private String recommendationNotes;

    public CourseRecommendationDto() {}

    public CourseRecommendationDto(CourseDto course, BigDecimal recommendationScore, List<String> skillGapsCovered, String primaryTargetSkill, int totalProficiencyGain, String explanation, int matchRank) {
        this.course = course;
        this.recommendationScore = recommendationScore;
        this.skillGapsCovered = skillGapsCovered;
        this.primaryTargetSkill = primaryTargetSkill;
        this.totalProficiencyGain = totalProficiencyGain;
        this.explanation = explanation;
        this.matchRank = matchRank;
    }

    public CourseRecommendationDto(CourseDto course, BigDecimal recommendationScore, List<String> skillGapsCovered, String primaryTargetSkill, int totalProficiencyGain, String explanation, int matchRank, String recommendedByRole, String recommendedByName, String recommendationNotes) {
        this.course = course;
        this.recommendationScore = recommendationScore;
        this.skillGapsCovered = skillGapsCovered;
        this.primaryTargetSkill = primaryTargetSkill;
        this.totalProficiencyGain = totalProficiencyGain;
        this.explanation = explanation;
        this.matchRank = matchRank;
        this.recommendedByRole = recommendedByRole;
        this.recommendedByName = recommendedByName;
        this.recommendationNotes = recommendationNotes;
    }

    public CourseDto getCourse() { return course; }
    public void setCourse(CourseDto course) { this.course = course; }

    public BigDecimal getRecommendationScore() { return recommendationScore; }
    public void setRecommendationScore(BigDecimal recommendationScore) { this.recommendationScore = recommendationScore; }

    public List<String> getSkillGapsCovered() { return skillGapsCovered; }
    public void setSkillGapsCovered(List<String> skillGapsCovered) { this.skillGapsCovered = skillGapsCovered; }

    public String getPrimaryTargetSkill() { return primaryTargetSkill; }
    public void setPrimaryTargetSkill(String primaryTargetSkill) { this.primaryTargetSkill = primaryTargetSkill; }

    public int getTotalProficiencyGain() { return totalProficiencyGain; }
    public void setTotalProficiencyGain(int totalProficiencyGain) { this.totalProficiencyGain = totalProficiencyGain; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public int getMatchRank() { return matchRank; }
    public void setMatchRank(int matchRank) { this.matchRank = matchRank; }

    public String getRecommendedByRole() { return recommendedByRole; }
    public void setRecommendedByRole(String recommendedByRole) { this.recommendedByRole = recommendedByRole; }

    public String getRecommendedByName() { return recommendedByName; }
    public void setRecommendedByName(String recommendedByName) { this.recommendedByName = recommendedByName; }

    public String getRecommendationNotes() { return recommendationNotes; }
    public void setRecommendationNotes(String recommendationNotes) { this.recommendationNotes = recommendationNotes; }
}
