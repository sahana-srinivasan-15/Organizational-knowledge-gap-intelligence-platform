package com.orgkgi.dto.learningpath;

public class PlatformCourseVerificationRequest {

    private String platform = "Coursera";
    private String credentialUrlOrId;

    public PlatformCourseVerificationRequest() {}

    public PlatformCourseVerificationRequest(String platform, String credentialUrlOrId) {
        this.platform = platform;
        this.credentialUrlOrId = credentialUrlOrId;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getCredentialUrlOrId() {
        return credentialUrlOrId;
    }

    public void setCredentialUrlOrId(String credentialUrlOrId) {
        this.credentialUrlOrId = credentialUrlOrId;
    }
}

