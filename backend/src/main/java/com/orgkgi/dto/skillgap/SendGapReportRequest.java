package com.orgkgi.dto.skillgap;

public class SendGapReportRequest {

    private Double testScore;
    private String notes;

    public SendGapReportRequest() {}

    public SendGapReportRequest(Double testScore, String notes) {
        this.testScore = testScore;
        this.notes = notes;
    }

    public Double getTestScore() {
        return testScore;
    }

    public void setTestScore(Double testScore) {
        this.testScore = testScore;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

