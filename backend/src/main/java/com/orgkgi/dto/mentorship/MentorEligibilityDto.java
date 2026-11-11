package com.orgkgi.dto.mentorship;

import java.util.ArrayList;
import java.util.List;

public class MentorEligibilityDto {

    private boolean eligible;
    private boolean hasUploadedCertificate;
    private long certificateCount;
    private boolean hasPassedAssessment;
    private long passedAssessmentsCount;
    private String summaryMessage;
    private String policyRule;
    private long qualifiedCoursesCount;
    private long pendingCoursesCount;
    private List<EligibilityCriterionDto> criteria = new ArrayList<>();
    private List<CourseMentorQualificationDto> courseQualifications = new ArrayList<>();

    public MentorEligibilityDto() {
        this.policyRule = "Mentor qualification is strictly course-specific. A mentor is only qualified for courses where they have uploaded an authentic certificate AND passed the diagnostic quiz. To mentor in additional courses, this verification process must be repeated for each course.";
    }

    public MentorEligibilityDto(boolean eligible, boolean hasUploadedCertificate, long certificateCount,
                                boolean hasPassedAssessment, long passedAssessmentsCount,
                                String summaryMessage) {
        this();
        this.eligible = eligible;
        this.hasUploadedCertificate = hasUploadedCertificate;
        this.certificateCount = certificateCount;
        this.hasPassedAssessment = hasPassedAssessment;
        this.passedAssessmentsCount = passedAssessmentsCount;
        this.summaryMessage = summaryMessage;
    }

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }

    public boolean isHasUploadedCertificate() { return hasUploadedCertificate; }
    public void setHasUploadedCertificate(boolean hasUploadedCertificate) { this.hasUploadedCertificate = hasUploadedCertificate; }

    public long getCertificateCount() { return certificateCount; }
    public void setCertificateCount(long certificateCount) { this.certificateCount = certificateCount; }

    public boolean isHasPassedAssessment() { return hasPassedAssessment; }
    public void setHasPassedAssessment(boolean hasPassedAssessment) { this.hasPassedAssessment = hasPassedAssessment; }

    public long getPassedAssessmentsCount() { return passedAssessmentsCount; }
    public void setPassedAssessmentsCount(long passedAssessmentsCount) { this.passedAssessmentsCount = passedAssessmentsCount; }

    public String getSummaryMessage() { return summaryMessage; }
    public void setSummaryMessage(String summaryMessage) { this.summaryMessage = summaryMessage; }

    public String getPolicyRule() { return policyRule; }
    public void setPolicyRule(String policyRule) { this.policyRule = policyRule; }

    public long getQualifiedCoursesCount() { return qualifiedCoursesCount; }
    public void setQualifiedCoursesCount(long qualifiedCoursesCount) { this.qualifiedCoursesCount = qualifiedCoursesCount; }

    public long getPendingCoursesCount() { return pendingCoursesCount; }
    public void setPendingCoursesCount(long pendingCoursesCount) { this.pendingCoursesCount = pendingCoursesCount; }

    public List<EligibilityCriterionDto> getCriteria() { return criteria; }
    public void setCriteria(List<EligibilityCriterionDto> criteria) { this.criteria = criteria; }

    public List<CourseMentorQualificationDto> getCourseQualifications() { return courseQualifications; }
    public void setCourseQualifications(List<CourseMentorQualificationDto> courseQualifications) {
        this.courseQualifications = courseQualifications;
    }

    public static class EligibilityCriterionDto {
        private String key;
        private String title;
        private String description;
        private boolean met;

        public EligibilityCriterionDto() {}

        public EligibilityCriterionDto(String key, String title, String description, boolean met) {
            this.key = key;
            this.title = title;
            this.description = description;
            this.met = met;
        }

        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public boolean isMet() { return met; }
        public void setMet(boolean met) { this.met = met; }
    }
}
