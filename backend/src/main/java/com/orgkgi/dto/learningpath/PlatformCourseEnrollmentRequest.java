package com.orgkgi.dto.learningpath;

import jakarta.validation.constraints.NotBlank;

public class PlatformCourseEnrollmentRequest {

    private String platform = "Coursera";

    private String courseSlug;

    @NotBlank(message = "Course title is required")
    private String courseTitle;

    private String courseUrl;

    public PlatformCourseEnrollmentRequest() {}

    public PlatformCourseEnrollmentRequest(String platform, String courseSlug, String courseTitle, String courseUrl) {
        this.platform = platform;
        this.courseSlug = courseSlug;
        this.courseTitle = courseTitle;
        this.courseUrl = courseUrl;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getCourseSlug() {
        return courseSlug;
    }

    public void setCourseSlug(String courseSlug) {
        this.courseSlug = courseSlug;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getCourseUrl() {
        return courseUrl;
    }

    public void setCourseUrl(String courseUrl) {
        this.courseUrl = courseUrl;
    }
}

