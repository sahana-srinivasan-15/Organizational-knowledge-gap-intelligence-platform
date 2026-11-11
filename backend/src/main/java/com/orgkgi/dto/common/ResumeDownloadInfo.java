package com.orgkgi.dto.common;

import org.springframework.core.io.Resource;

public class ResumeDownloadInfo {

    private final Resource resource;
    private final String filename;
    private final String contentType;

    public ResumeDownloadInfo(Resource resource, String filename, String contentType) {
        this.resource = resource;
        this.filename = filename;
        this.contentType = contentType;
    }

    public Resource getResource() {
        return resource;
    }

    public String getFilename() {
        return filename;
    }

    public String getContentType() {
        return contentType;
    }
}
