package com.orgkgi.dto.ml;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

public class PredictionResultDto {

    private Long id;
    private Long employeeProfileId;
    private String employeeFullName;
    private Long courseId;
    private String courseTitle;
    private Long learningPathId;

    private String predictedOutcome; // SUCCESS or AT_RISK
    private BigDecimal predictedSuccessProbability;
    private String riskLevel; // LOW, MEDIUM, HIGH
    private String modelVersion;
    private String dataProvenance;
    private String modelDisclaimer;

    private Map<String, Object> featureSnapshot;
    private OffsetDateTime createdAt;

    public PredictionResultDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeProfileId() { return employeeProfileId; }
    public void setEmployeeProfileId(Long employeeProfileId) { this.employeeProfileId = employeeProfileId; }

    public String getEmployeeFullName() { return employeeFullName; }
    public void setEmployeeFullName(String employeeFullName) { this.employeeFullName = employeeFullName; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public Long getLearningPathId() { return learningPathId; }
    public void setLearningPathId(Long learningPathId) { this.learningPathId = learningPathId; }

    public String getPredictedOutcome() { return predictedOutcome; }
    public void setPredictedOutcome(String predictedOutcome) { this.predictedOutcome = predictedOutcome; }

    public BigDecimal getPredictedSuccessProbability() { return predictedSuccessProbability; }
    public void setPredictedSuccessProbability(BigDecimal predictedSuccessProbability) { this.predictedSuccessProbability = predictedSuccessProbability; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public String getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(String dataProvenance) { this.dataProvenance = dataProvenance; }

    public String getModelDisclaimer() { return modelDisclaimer; }
    public void setModelDisclaimer(String modelDisclaimer) { this.modelDisclaimer = modelDisclaimer; }

    public Map<String, Object> getFeatureSnapshot() { return featureSnapshot; }
    public void setFeatureSnapshot(Map<String, Object> featureSnapshot) { this.featureSnapshot = featureSnapshot; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
