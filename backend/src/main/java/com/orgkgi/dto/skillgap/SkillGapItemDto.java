package com.orgkgi.dto.skillgap;

import com.orgkgi.entity.VerificationStatus;

public class SkillGapItemDto {

    private Long skillId;
    private String skillName;
    private String skillCode;
    private String categoryName;
    private Integer requiredProficiency;
    private Integer verifiedProficiency;
    private Integer selfReportedProficiency;
    private VerificationStatus verificationStatus;
    private String assessmentStatus; // VERIFIED, UNVERIFIED_SELF_REPORTED, UNASSESSED
    private Double importanceWeight;
    private Integer rawGap;
    private Double weightedGap;
    private String criticality; // MANDATORY, CORE, ELECTIVE
    private String statusDescription;
    private Boolean isDynamicWeight = true;
    private String calculationMethod = "DYNAMIC_COMPETENCY_MODEL";

    public SkillGapItemDto() {}

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getSkillCode() { return skillCode; }
    public void setSkillCode(String skillCode) { this.skillCode = skillCode; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public Integer getRequiredProficiency() { return requiredProficiency; }
    public void setRequiredProficiency(Integer requiredProficiency) { this.requiredProficiency = requiredProficiency; }

    public Integer getVerifiedProficiency() { return verifiedProficiency; }
    public void setVerifiedProficiency(Integer verifiedProficiency) { this.verifiedProficiency = verifiedProficiency; }

    public Integer getSelfReportedProficiency() { return selfReportedProficiency; }
    public void setSelfReportedProficiency(Integer selfReportedProficiency) { this.selfReportedProficiency = selfReportedProficiency; }

    public VerificationStatus getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(VerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getAssessmentStatus() { return assessmentStatus; }
    public void setAssessmentStatus(String assessmentStatus) { this.assessmentStatus = assessmentStatus; }

    public Double getImportanceWeight() { return importanceWeight; }
    public void setImportanceWeight(Double importanceWeight) { this.importanceWeight = importanceWeight; }

    public Integer getRawGap() { return rawGap; }
    public void setRawGap(Integer rawGap) { this.rawGap = rawGap; }

    public Double getWeightedGap() { return weightedGap; }
    public void setWeightedGap(Double weightedGap) { this.weightedGap = weightedGap; }

    public String getCriticality() { return criticality; }
    public void setCriticality(String criticality) { this.criticality = criticality; }

    public String getStatusDescription() { return statusDescription; }
    public void setStatusDescription(String statusDescription) { this.statusDescription = statusDescription; }

    public Boolean getIsMandatory() { return "MANDATORY".equalsIgnoreCase(criticality); }
    public boolean isMandatory() { return "MANDATORY".equalsIgnoreCase(criticality); }

    public Boolean getIsDynamicWeight() { return isDynamicWeight; }
    public void setIsDynamicWeight(Boolean isDynamicWeight) { this.isDynamicWeight = isDynamicWeight; }

    public String getCalculationMethod() { return calculationMethod; }
    public void setCalculationMethod(String calculationMethod) { this.calculationMethod = calculationMethod; }
}
