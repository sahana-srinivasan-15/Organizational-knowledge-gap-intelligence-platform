package com.orgkgi.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class InquireManagerRequest {

    @NotNull
    private Long userId;

    @NotBlank
    private String inquiryQuestion;

    public InquireManagerRequest() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getInquiryQuestion() { return inquiryQuestion; }
    public void setInquiryQuestion(String inquiryQuestion) { this.inquiryQuestion = inquiryQuestion; }
}

