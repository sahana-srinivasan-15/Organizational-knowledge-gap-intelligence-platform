package com.orgkgi.dto.certificate;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.Map;

public class MlCertificateVerificationResponse {

    @JsonProperty("is_authentic")
    private Boolean isAuthentic;

    @JsonProperty("authenticity_score")
    private BigDecimal authenticityScore;

    @JsonProperty("confidence")
    private String confidence;

    @JsonProperty("status")
    private String status;

    @JsonProperty("model_version")
    private String modelVersion;

    @JsonProperty("verification_details")
    private Map<String, Object> verificationDetails;

    @JsonProperty("message")
    private String message;

    public MlCertificateVerificationResponse() {}

    public Boolean getIsAuthentic() { return isAuthentic; }
    public void setIsAuthentic(Boolean authentic) { isAuthentic = authentic; }

    public BigDecimal getAuthenticityScore() { return authenticityScore; }
    public void setAuthenticityScore(BigDecimal authenticityScore) { this.authenticityScore = authenticityScore; }

    public String getConfidence() { return confidence; }
    public void setConfidence(String confidence) { this.confidence = confidence; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public Map<String, Object> getVerificationDetails() { return verificationDetails; }
    public void setVerificationDetails(Map<String, Object> verificationDetails) { this.verificationDetails = verificationDetails; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

