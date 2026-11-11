package com.orgkgi.dto.ml;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class MlPredictionResponse {

    @JsonProperty("predicted_outcome")
    private String predictedOutcome; // SUCCESS or AT_RISK

    @JsonProperty("predicted_class")
    private Integer predictedClass; // 1 or 0

    @JsonProperty("success_probability")
    private Double successProbability;

    @JsonProperty("risk_level")
    private String riskLevel; // LOW, MEDIUM, HIGH

    @JsonProperty("model_version")
    private String modelVersion;

    @JsonProperty("data_provenance")
    private String dataProvenance;

    @JsonProperty("feature_snapshot")
    private Map<String, Object> featureSnapshot;

    public MlPredictionResponse() {}

    public String getPredictedOutcome() { return predictedOutcome; }
    public void setPredictedOutcome(String predictedOutcome) { this.predictedOutcome = predictedOutcome; }

    public Integer getPredictedClass() { return predictedClass; }
    public void setPredictedClass(Integer predictedClass) { this.predictedClass = predictedClass; }

    public Double getSuccessProbability() { return successProbability; }
    public void setSuccessProbability(Double successProbability) { this.successProbability = successProbability; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public String getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(String dataProvenance) { this.dataProvenance = dataProvenance; }

    public Map<String, Object> getFeatureSnapshot() { return featureSnapshot; }
    public void setFeatureSnapshot(Map<String, Object> featureSnapshot) { this.featureSnapshot = featureSnapshot; }
}
