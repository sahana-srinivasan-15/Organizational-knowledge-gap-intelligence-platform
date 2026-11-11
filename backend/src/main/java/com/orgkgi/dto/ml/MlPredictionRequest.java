package com.orgkgi.dto.ml;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class MlPredictionRequest {

    @NotNull
    @DecimalMin("1.0")
    @DecimalMax("5.0")
    @JsonProperty("baseline_proficiency_avg")
    private Double baselineProficiencyAvg;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("20.0")
    @JsonProperty("initial_gap_magnitude")
    private Double initialGapMagnitude;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("1.0")
    @JsonProperty("historical_completion_rate")
    private Double historicalCompletionRate;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    @JsonProperty("diagnostic_assessment_score")
    private Double diagnosticAssessmentScore;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("40.0")
    @JsonProperty("weekly_engagement_hours")
    private Double weeklyEngagementHours;

    @NotNull
    @Min(1)
    @Max(3)
    @JsonProperty("course_difficulty_level")
    private Integer courseDifficultyLevel;

    @NotNull
    @Min(0)
    @Max(1)
    @JsonProperty("mentor_assigned_flag")
    private Integer mentorAssignedFlag;

    @NotNull
    @Min(0)
    @Max(360)
    @JsonProperty("tenure_months")
    private Integer tenureMonths;

    public MlPredictionRequest() {}

    public MlPredictionRequest(Double baselineProficiencyAvg, Double initialGapMagnitude, Double historicalCompletionRate, Double diagnosticAssessmentScore, Double weeklyEngagementHours, Integer courseDifficultyLevel, Integer mentorAssignedFlag, Integer tenureMonths) {
        this.baselineProficiencyAvg = baselineProficiencyAvg;
        this.initialGapMagnitude = initialGapMagnitude;
        this.historicalCompletionRate = historicalCompletionRate;
        this.diagnosticAssessmentScore = diagnosticAssessmentScore;
        this.weeklyEngagementHours = weeklyEngagementHours;
        this.courseDifficultyLevel = courseDifficultyLevel;
        this.mentorAssignedFlag = mentorAssignedFlag;
        this.tenureMonths = tenureMonths;
    }

    public Double getBaselineProficiencyAvg() { return baselineProficiencyAvg; }
    public void setBaselineProficiencyAvg(Double baselineProficiencyAvg) { this.baselineProficiencyAvg = baselineProficiencyAvg; }

    public Double getInitialGapMagnitude() { return initialGapMagnitude; }
    public void setInitialGapMagnitude(Double initialGapMagnitude) { this.initialGapMagnitude = initialGapMagnitude; }

    public Double getHistoricalCompletionRate() { return historicalCompletionRate; }
    public void setHistoricalCompletionRate(Double historicalCompletionRate) { this.historicalCompletionRate = historicalCompletionRate; }

    public Double getDiagnosticAssessmentScore() { return diagnosticAssessmentScore; }
    public void setDiagnosticAssessmentScore(Double diagnosticAssessmentScore) { this.diagnosticAssessmentScore = diagnosticAssessmentScore; }

    public Double getWeeklyEngagementHours() { return weeklyEngagementHours; }
    public void setWeeklyEngagementHours(Double weeklyEngagementHours) { this.weeklyEngagementHours = weeklyEngagementHours; }

    public Integer getCourseDifficultyLevel() { return courseDifficultyLevel; }
    public void setCourseDifficultyLevel(Integer courseDifficultyLevel) { this.courseDifficultyLevel = courseDifficultyLevel; }

    public Integer getMentorAssignedFlag() { return mentorAssignedFlag; }
    public void setMentorAssignedFlag(Integer mentorAssignedFlag) { this.mentorAssignedFlag = mentorAssignedFlag; }

    public Integer getTenureMonths() { return tenureMonths; }
    public void setTenureMonths(Integer tenureMonths) { this.tenureMonths = tenureMonths; }
}
