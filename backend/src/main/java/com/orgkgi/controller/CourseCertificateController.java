package com.orgkgi.controller;

import com.orgkgi.dto.certificate.CourseCertificateDto;
import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.service.CourseCertificateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/certificates")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Course Certificates", description = "Upload, verify and retrieve course completion certificates")
public class CourseCertificateController {

    private final CourseCertificateService certificateService;

    public CourseCertificateController(CourseCertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload course completion certificate with file or verification credential URL")
    public ResponseEntity<ApiResponse<CourseCertificateDto>> uploadCertificate(
            @RequestParam("courseTitle") String courseTitle,
            @RequestParam(value = "courseProvider", required = false) String courseProvider,
            @RequestParam(value = "courseSlug", required = false) String courseSlug,
            @RequestParam(value = "credentialUrl", required = false) String credentialUrl,
            @RequestParam(value = "completionDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate completionDate,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        CourseCertificateDto dto = certificateService.uploadCertificate(
                courseTitle, courseProvider, courseSlug, credentialUrl, completionDate, file
        );
        return ResponseEntity.ok(ApiResponse.success("Course certificate submitted and verified successfully", dto));
    }

    @GetMapping("/my-certificates")
    @Operation(summary = "Get all certificates uploaded by authenticated employee")
    public ResponseEntity<ApiResponse<List<CourseCertificateDto>>> getOwnCertificates() {
        List<CourseCertificateDto> list = certificateService.getOwnCertificates();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/download/{id}")
    @Operation(summary = "Download uploaded certificate file")
    public ResponseEntity<Resource> downloadCertificate(@PathVariable Long id) {
        Resource resource = certificateService.getCertificateResource(id);
        String filename = resource.getFilename() != null ? resource.getFilename() : "certificate.pdf";
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            String probe = Files.probeContentType(resource.getFile().toPath());
            if (probe != null) {
                mediaType = MediaType.parseMediaType(probe);
            }
        } catch (Exception ignored) {}

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
}

