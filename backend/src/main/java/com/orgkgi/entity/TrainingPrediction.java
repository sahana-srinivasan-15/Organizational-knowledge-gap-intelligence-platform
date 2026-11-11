package com.orgkgi.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "training_predictions")
public class TrainingPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_profile_id", nullable = false)
    private EmployeeProfile employeeProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learning_path_id")
    private LearningPath learningPath;

    @Column(name = "predicted_outcome", nullable = false, length = 20)
    private String predictedOutcome; // SUCCESS or AT_RISK

    @Column(name = "predicted_success_probability", precision = 5, scale = 4, nullable = false)
    private BigDecimal predictedSuccessProbability;

    @Column(name = "risk_level", nullable = false, length = 20)
    private String riskLevel; // LOW, MEDIUM, HIGH

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "feature_snapshot_json", columnDefinition = "jsonb", nullable = false)
    private String featureSnapshotJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public TrainingPrediction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public EmployeeProfile getEmployeeProfile() { return employeeProfile; }
    public void setEmployeeProfile(EmployeeProfile employeeProfile) { this.employeeProfile = employeeProfile; }

    public LearningPath getLearningPath() { return learningPath; }
    public void setLearningPath(LearningPath learningPath) { this.learningPath = learningPath; }

    public String getPredictedOutcome() { return predictedOutcome; }
    public void setPredictedOutcome(String predictedOutcome) { this.predictedOutcome = predictedOutcome; }

    public BigDecimal getPredictedSuccessProbability() { return predictedSuccessProbability; }
    public void setPredictedSuccessProbability(BigDecimal predictedSuccessProbability) { this.predictedSuccessProbability = predictedSuccessProbability; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public String getFeatureSnapshotJson() { return featureSnapshotJson; }
    public void setFeatureSnapshotJson(String featureSnapshotJson) { this.featureSnapshotJson = featureSnapshotJson; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
