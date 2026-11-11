package com.orgkgi.dto.discovery;

import java.util.List;

public class TrendingCourseDto {

    private String id;
    private String title;
    private String provider;
    private String slug;
    private String externalUrl;
    private String photoUrl;
    private String description;
    private String workload;
    private String level;
    private String partnerName;
    private String instructorName;
    private Boolean certificateAvailable;
    private String certificateType;
    private String primaryLanguage;
    private String courseType;
    private List<String> domainTags;
    private String matchedSkillName;
    private Long matchedSkillId;
    private Integer rawGap;
    private Integer requiredProficiency;
    private Integer verifiedProficiency;
    private Double matchRelevanceScore;
    private String recommendationReason;
    private Boolean isLiveFromApi;
    private Boolean hasUploadedCertificate;
    private Long certificateId;
    private Boolean isCompleted;

    public TrendingCourseDto() {
        this.provider = "Coursera";
        this.isLiveFromApi = true;
        this.hasUploadedCertificate = false;
        this.isCompleted = false;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public void setExternalUrl(String externalUrl) {
        this.externalUrl = externalUrl;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getWorkload() {
        return workload;
    }

    public void setWorkload(String workload) {
        this.workload = workload;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getPartnerName() {
        return partnerName;
    }

    public void setPartnerName(String partnerName) {
        this.partnerName = partnerName;
    }

    public String getInstructorName() {
        return instructorName;
    }

    public void setInstructorName(String instructorName) {
        this.instructorName = instructorName;
    }

    public Boolean getCertificateAvailable() {
        return certificateAvailable;
    }

    public void setCertificateAvailable(Boolean certificateAvailable) {
        this.certificateAvailable = certificateAvailable;
    }

    public String getCertificateType() {
        return certificateType;
    }

    public void setCertificateType(String certificateType) {
        this.certificateType = certificateType;
    }

    public String getPrimaryLanguage() {
        return primaryLanguage;
    }

    public void setPrimaryLanguage(String primaryLanguage) {
        this.primaryLanguage = primaryLanguage;
    }

    public String getCourseType() {
        return courseType;
    }

    public void setCourseType(String courseType) {
        this.courseType = courseType;
    }

    public List<String> getDomainTags() {
        return domainTags;
    }

    public void setDomainTags(List<String> domainTags) {
        this.domainTags = domainTags;
    }

    public String getMatchedSkillName() {
        return matchedSkillName;
    }

    public void setMatchedSkillName(String matchedSkillName) {
        this.matchedSkillName = matchedSkillName;
    }

    public Long getMatchedSkillId() {
        return matchedSkillId;
    }

    public void setMatchedSkillId(Long matchedSkillId) {
        this.matchedSkillId = matchedSkillId;
    }

    public Integer getRawGap() {
        return rawGap;
    }

    public void setRawGap(Integer rawGap) {
        this.rawGap = rawGap;
    }

    public Integer getRequiredProficiency() {
        return requiredProficiency;
    }

    public void setRequiredProficiency(Integer requiredProficiency) {
        this.requiredProficiency = requiredProficiency;
    }

    public Integer getVerifiedProficiency() {
        return verifiedProficiency;
    }

    public void setVerifiedProficiency(Integer verifiedProficiency) {
        this.verifiedProficiency = verifiedProficiency;
    }

    public Double getMatchRelevanceScore() {
        return matchRelevanceScore;
    }

    public void setMatchRelevanceScore(Double matchRelevanceScore) {
        this.matchRelevanceScore = matchRelevanceScore;
    }

    public String getRecommendationReason() {
        return recommendationReason;
    }

    public void setRecommendationReason(String recommendationReason) {
        this.recommendationReason = recommendationReason;
    }

    public Boolean getIsLiveFromApi() {
        return isLiveFromApi;
    }

    public void setIsLiveFromApi(Boolean liveFromApi) {
        isLiveFromApi = liveFromApi;
    }

    public Boolean getHasUploadedCertificate() {
        return hasUploadedCertificate;
    }

    public void setHasUploadedCertificate(Boolean hasUploadedCertificate) {
        this.hasUploadedCertificate = hasUploadedCertificate;
    }

    public Long getCertificateId() {
        return certificateId;
    }

    public void setCertificateId(Long certificateId) {
        this.certificateId = certificateId;
    }

    public Boolean getIsCompleted() {
        return isCompleted;
    }

    public void setIsCompleted(Boolean completed) {
        isCompleted = completed;
    }
}
