package com.orgkgi.dto.assessment;

import com.orgkgi.dto.course.CourseRecommendationDto;
import com.orgkgi.dto.mentorship.MentorCandidateDto;
import com.orgkgi.entity.VerificationStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class AssessmentResultDto {
    private Long submissionId;
    private Long attemptId;
    private Integer attemptNumber = 1;
    private Long assessmentId;
    private String assessmentTitle;
    private Long courseId;
    private String courseTitle;
    private Long skillId;
    private String skillName;
    private BigDecimal score;
    private Boolean passed;
    private BigDecimal passingScore;
    private int totalQuestions;
    private int correctQuestions;
    private OffsetDateTime attemptedAt;
    private VerificationStatus verificationStatus;
    private Integer verifiedProficiencyLevel;
    private String feedback;
    private List<QuestionFeedbackDto> questionFeedback = new ArrayList<>();
    private List<AssessmentKnowledgeGapDto> knowledgeGaps = new ArrayList<>();
    private List<CourseRecommendationDto> recommendedCourses = new ArrayList<>();
    private List<MentorCandidateDto> recommendedMentors = new ArrayList<>();

    public AssessmentResultDto() {}

    public Long getSubmissionId() { return submissionId; }
    public void setSubmissionId(Long submissionId) { this.submissionId = submissionId; }

    public Long getAssessmentId() { return assessmentId; }
    public void setAssessmentId(Long assessmentId) { this.assessmentId = assessmentId; }

    public String getAssessmentTitle() { return assessmentTitle; }
    public void setAssessmentTitle(String assessmentTitle) { this.assessmentTitle = assessmentTitle; }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }

    public BigDecimal getPassingScore() { return passingScore; }
    public void setPassingScore(BigDecimal passingScore) { this.passingScore = passingScore; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public int getCorrectQuestions() { return correctQuestions; }
    public void setCorrectQuestions(int correctQuestions) { this.correctQuestions = correctQuestions; }

    public OffsetDateTime getAttemptedAt() { return attemptedAt; }
    public void setAttemptedAt(OffsetDateTime attemptedAt) { this.attemptedAt = attemptedAt; }

    public VerificationStatus getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(VerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }

    public Integer getVerifiedProficiencyLevel() { return verifiedProficiencyLevel; }
    public void setVerifiedProficiencyLevel(Integer verifiedProficiencyLevel) { this.verifiedProficiencyLevel = verifiedProficiencyLevel; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public List<QuestionFeedbackDto> getQuestionFeedback() { return questionFeedback; }
    public void setQuestionFeedback(List<QuestionFeedbackDto> questionFeedback) { this.questionFeedback = questionFeedback; }

    public Long getAttemptId() { return attemptId; }
    public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }

    public Integer getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(Integer attemptNumber) { this.attemptNumber = attemptNumber; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public List<AssessmentKnowledgeGapDto> getKnowledgeGaps() { return knowledgeGaps; }
    public void setKnowledgeGaps(List<AssessmentKnowledgeGapDto> knowledgeGaps) { this.knowledgeGaps = knowledgeGaps; }

    public List<CourseRecommendationDto> getRecommendedCourses() { return recommendedCourses; }
    public void setRecommendedCourses(List<CourseRecommendationDto> recommendedCourses) { this.recommendedCourses = recommendedCourses; }

    public List<MentorCandidateDto> getRecommendedMentors() { return recommendedMentors; }
    public void setRecommendedMentors(List<MentorCandidateDto> recommendedMentors) { this.recommendedMentors = recommendedMentors; }
}
