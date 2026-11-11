package com.orgkgi.dto.certificate;

import com.fasterxml.jackson.annotation.JsonProperty;

public class MlCertificateVerificationRequest {

    @JsonProperty("course_title")
    private String courseTitle;

    @JsonProperty("course_provider")
    private String courseProvider;

    @JsonProperty("course_slug")
    private String courseSlug;

    @JsonProperty("credential_url")
    private String credentialUrl;

    @JsonProperty("file_name")
    private String fileName;

    @JsonProperty("file_path")
    private String filePath;

    @JsonProperty("file_size_bytes")
    private Long fileSizeBytes;

    @JsonProperty("file_mime_type")
    private String fileMimeType;

    @JsonProperty("completion_date")
    private String completionDate;

    public MlCertificateVerificationRequest() {}

    public MlCertificateVerificationRequest(String courseTitle, String courseProvider, String courseSlug, String credentialUrl, String fileName, String filePath, Long fileSizeBytes, String fileMimeType, String completionDate) {
        this.courseTitle = courseTitle;
        this.courseProvider = courseProvider;
        this.courseSlug = courseSlug;
        this.credentialUrl = credentialUrl;
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileSizeBytes = fileSizeBytes;
        this.fileMimeType = fileMimeType;
        this.completionDate = completionDate;
    }

    public MlCertificateVerificationRequest(String courseTitle, String courseProvider, String courseSlug, String credentialUrl, String fileName, Long fileSizeBytes, String fileMimeType, String completionDate) {
        this(courseTitle, courseProvider, courseSlug, credentialUrl, fileName, null, fileSizeBytes, fileMimeType, completionDate);
    }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getCourseProvider() { return courseProvider; }
    public void setCourseProvider(String courseProvider) { this.courseProvider = courseProvider; }

    public String getCourseSlug() { return courseSlug; }
    public void setCourseSlug(String courseSlug) { this.courseSlug = courseSlug; }

    public String getCredentialUrl() { return credentialUrl; }
    public void setCredentialUrl(String credentialUrl) { this.credentialUrl = credentialUrl; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public String getFileMimeType() { return fileMimeType; }
    public void setFileMimeType(String fileMimeType) { this.fileMimeType = fileMimeType; }

    public String getCompletionDate() { return completionDate; }
    public void setCompletionDate(String completionDate) { this.completionDate = completionDate; }
}

