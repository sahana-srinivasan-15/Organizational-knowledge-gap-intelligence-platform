package com.orgkgi.dto.assessment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.time.OffsetDateTime;
import java.util.List;

public class AssessmentSubmissionRequestDto {

    private Long attemptId;
    private OffsetDateTime startedAt;

    @NotEmpty(message = "Answers list must not be empty")
    @Valid
    private List<AnswerSubmissionDto> answers;

    public AssessmentSubmissionRequestDto() {}

    public AssessmentSubmissionRequestDto(OffsetDateTime startedAt, List<AnswerSubmissionDto> answers) {
        this(null, startedAt, answers);
    }

    public AssessmentSubmissionRequestDto(Long attemptId, OffsetDateTime startedAt, List<AnswerSubmissionDto> answers) {
        this.attemptId = attemptId;
        this.startedAt = startedAt;
        this.answers = answers;
    }

    public Long getAttemptId() { return attemptId; }
    public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }

    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }

    public List<AnswerSubmissionDto> getAnswers() { return answers; }
    public void setAnswers(List<AnswerSubmissionDto> answers) { this.answers = answers; }
}
