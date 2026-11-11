package com.orgkgi.dto.weakarea;

import java.util.ArrayList;
import java.util.List;

public class WeakAreaDto {

    private Long skillId;
    private String skillName;
    private String skillCode;
    private String categoryName;
    private Integer currentProficiency;
    private Integer requiredProficiency;
    private Integer gap;
    private Boolean isWeakArea;
    private String reason;
    private Double diagnosticScore;
    private Boolean diagnosticPassed;
    private String mentorName;
    private Long mentorId;
    private List<SkillMaterialDto> materials = new ArrayList<>();
    private List<WeakAreaReviewDto> reviews = new ArrayList<>();

    public WeakAreaDto() {}

    public Long getSkillId() {
        return skillId;
    }

    public void setSkillId(Long skillId) {
        this.skillId = skillId;
    }

    public String getSkillName() {
        return skillName;
    }

    public void setSkillName(String skillName) {
        this.skillName = skillName;
    }

    public String getSkillCode() {
        return skillCode;
    }

    public void setSkillCode(String skillCode) {
        this.skillCode = skillCode;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Integer getCurrentProficiency() {
        return currentProficiency;
    }

    public void setCurrentProficiency(Integer currentProficiency) {
        this.currentProficiency = currentProficiency;
    }

    public Integer getRequiredProficiency() {
        return requiredProficiency;
    }

    public void setRequiredProficiency(Integer requiredProficiency) {
        this.requiredProficiency = requiredProficiency;
    }

    public Integer getGap() {
        return gap;
    }

    public void setGap(Integer gap) {
        this.gap = gap;
    }

    public Boolean getIsWeakArea() {
        return isWeakArea;
    }

    public void setIsWeakArea(Boolean isWeakArea) {
        this.isWeakArea = isWeakArea;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Double getDiagnosticScore() {
        return diagnosticScore;
    }

    public void setDiagnosticScore(Double diagnosticScore) {
        this.diagnosticScore = diagnosticScore;
    }

    public Boolean getDiagnosticPassed() {
        return diagnosticPassed;
    }

    public void setDiagnosticPassed(Boolean diagnosticPassed) {
        this.diagnosticPassed = diagnosticPassed;
    }

    public String getMentorName() {
        return mentorName;
    }

    public void setMentorName(String mentorName) {
        this.mentorName = mentorName;
    }

    public Long getMentorId() {
        return mentorId;
    }

    public void setMentorId(Long mentorId) {
        this.mentorId = mentorId;
    }

    public List<SkillMaterialDto> getMaterials() {
        return materials;
    }

    public void setMaterials(List<SkillMaterialDto> materials) {
        this.materials = materials;
    }

    public List<WeakAreaReviewDto> getReviews() {
        return reviews;
    }

    public void setReviews(List<WeakAreaReviewDto> reviews) {
        this.reviews = reviews;
    }
}

