package com.orgkgi.dto.weakarea;

import jakarta.validation.constraints.NotBlank;

public class SubmitMentorReviewFeedbackRequest {

    @NotBlank(message = "Mentor feedback is required")
    private String mentorFeedback;

    private String completionStatus; // IN_PROGRESS, REVIEWED, MASTERED

    public SubmitMentorReviewFeedbackRequest() {}

    public String getMentorFeedback() {
        return mentorFeedback;
    }

    public void setMentorFeedback(String mentorFeedback) {
        this.mentorFeedback = mentorFeedback;
    }

    public String getCompletionStatus() {
        return completionStatus;
    }

    public void setCompletionStatus(String completionStatus) {
        this.completionStatus = completionStatus;
    }
}

