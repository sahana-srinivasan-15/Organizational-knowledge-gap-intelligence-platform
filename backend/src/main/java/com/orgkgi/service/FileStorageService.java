package com.orgkgi.service;

import com.orgkgi.exception.BadRequestException;
import com.orgkgi.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path storageDirectory;
    private final Path certificateDirectory;
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("pdf", "doc", "docx", "txt", "rtf", "odt");
    private static final List<String> ALLOWED_CERT_EXTENSIONS = Arrays.asList("pdf", "png", "jpg", "jpeg", "webp");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public FileStorageService(
            @Value("${app.upload.dir:./uploads/resumes}") String uploadDir,
            @Value("${app.upload.cert-dir:./uploads/certificates}") String certUploadDir) {
        this.storageDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.certificateDirectory = Paths.get(certUploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageDirectory);
            Files.createDirectories(this.certificateDirectory);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create upload directories at " + this.storageDirectory + ", " + this.certificateDirectory, ex);
        }
    }

    public String storeResume(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Resume file size exceeds maximum permitted limit of 10MB");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "resume.pdf"));
        if (originalFilename.contains("..")) {
            throw new BadRequestException("Invalid filename sequence: " + originalFilename);
        }

        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BadRequestException("Unsupported file type ." + extension + ". Allowed formats: PDF, DOC, DOCX, TXT");
        }

        String uniqueFileName = UUID.randomUUID() + "_" + originalFilename;
        Path targetLocation = this.storageDirectory.resolve(uniqueFileName);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return targetLocation.toString();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store resume file: " + originalFilename, ex);
        }
    }

    public Resource loadResumeAsResource(String storedFilePath) {
        if (storedFilePath == null || storedFilePath.isBlank()) {
            throw new ResourceNotFoundException("Resume", "path", "empty");
        }

        try {
            Path filePath = Paths.get(storedFilePath).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Resume", "file", filePath.getFileName().toString());
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Resume", "path", storedFilePath);
        }
    }

    public String generateAndStoreResumePdf(
            Long userId,
            String fullName,
            String email,
            String jobRole,
            String department,
            List<String> skills,
            List<String> courses) {

        byte[] pdfBytes = generateCandidateResumePdf(fullName, email, jobRole, department, skills, courses);
        String cleanName = fullName.replaceAll("[^a-zA-Z0-9_-]", "_");
        String uniqueFileName = "employee_" + userId + "_" + cleanName + "_Resume.pdf";
        Path targetLocation = this.storageDirectory.resolve(uniqueFileName);

        try {
            Files.write(targetLocation, pdfBytes);
            return targetLocation.toString();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to save generated resume PDF", ex);
        }
    }

    public byte[] generateCandidateResumePdf(
            String fullName,
            String email,
            String jobRole,
            String department,
            List<String> skills,
            List<String> courses) {

        StringBuilder sb = new StringBuilder();

        // Background header accent bar
        sb.append("0.15 0.39 0.92 rg\n"); // #2563eb
        sb.append("0 740 612 52 re f\n");

        // Header text (white on blue)
        sb.append("BT\n");
        sb.append("/F2 20 Tf\n");
        sb.append("1 1 1 rg\n"); // White
        sb.append("40 760 Td\n");
        sb.append("(").append(escapePdf(fullName)).append(") Tj\n");
        sb.append("ET\n");

        sb.append("BT\n");
        sb.append("/F1 11 Tf\n");
        sb.append("0.9 0.95 1 rg\n");
        sb.append("40 746 Td\n");
        sb.append("(").append(escapePdf(jobRole)).append("  |  ").append(escapePdf(department)).append("  |  ").append(escapePdf(email)).append(") Tj\n");
        sb.append("ET\n");

        int currentY = 710;

        // Section: Summary
        sb.append("BT\n");
        sb.append("/F2 13 Tf\n");
        sb.append("0.1 0.15 0.25 rg\n");
        sb.append("40 ").append(currentY).append(" Td\n");
        sb.append("(CANDIDATE COMPETENCY PROFILE & VERIFIED SKILLS) Tj\n");
        sb.append("ET\n");

        currentY -= 8;
        sb.append("0.2 0.4 0.9 RG\n");
        sb.append("1 w\n");
        sb.append("40 ").append(currentY).append(" m 572 ").append(currentY).append(" l S\n");

        currentY -= 22;
        sb.append("BT\n");
        sb.append("/F1 10 Tf\n");
        sb.append("0.2 0.25 0.35 rg\n");
        sb.append("40 ").append(currentY).append(" Td\n");
        sb.append("(Verified talent profile managed under OrgKGI Competency & Peer Mentorship Platform.) Tj\n");
        sb.append("ET\n");

        // Section: Skills
        currentY -= 30;
        sb.append("BT\n");
        sb.append("/F2 13 Tf\n");
        sb.append("0.1 0.15 0.25 rg\n");
        sb.append("40 ").append(currentY).append(" Td\n");
        sb.append("(VERIFIED CORE COMPETENCIES) Tj\n");
        sb.append("ET\n");

        currentY -= 8;
        sb.append("0.2 0.4 0.9 RG\n");
        sb.append("40 ").append(currentY).append(" m 572 ").append(currentY).append(" l S\n");

        currentY -= 18;
        if (skills != null) {
            for (String skill : skills) {
                if (currentY < 90) break;
                sb.append("BT\n");
                sb.append("/F1 10 Tf\n");
                sb.append("0.2 0.25 0.35 rg\n");
                sb.append("50 ").append(currentY).append(" Td\n");
                sb.append("([*]  ").append(escapePdf(skill)).append(") Tj\n");
                sb.append("ET\n");
                currentY -= 16;
            }
        }

        // Section: Courses
        currentY -= 15;
        if (currentY > 120) {
            sb.append("BT\n");
            sb.append("/F2 13 Tf\n");
            sb.append("0.1 0.15 0.25 rg\n");
            sb.append("40 ").append(currentY).append(" Td\n");
            sb.append("(ACTIVE UPSKILLING ROADMAP) Tj\n");
            sb.append("ET\n");

            currentY -= 8;
            sb.append("0.2 0.4 0.9 RG\n");
            sb.append("40 ").append(currentY).append(" m 572 ").append(currentY).append(" l S\n");

            currentY -= 18;
            if (courses != null) {
                for (String course : courses) {
                    if (currentY < 75) break;
                    sb.append("BT\n");
                    sb.append("/F1 10 Tf\n");
                    sb.append("0.2 0.25 0.35 rg\n");
                    sb.append("50 ").append(currentY).append(" Td\n");
                    sb.append("([>]  ").append(escapePdf(course)).append(") Tj\n");
                    sb.append("ET\n");
                    currentY -= 16;
                }
            }
        }

        // Footer
        sb.append("0.85 0.9 0.95 RG\n");
        sb.append("40 45 m 572 45 l S\n");
        sb.append("BT\n");
        sb.append("/F1 8 Tf\n");
        sb.append("0.5 0.55 0.65 rg\n");
        sb.append("40 32 Td\n");
        sb.append("(OrgKGI Enterprise Knowledge Platform  -  Official Candidate Resume Document) Tj\n");
        sb.append("ET\n");

        byte[] streamBytes = sb.toString().getBytes(java.nio.charset.StandardCharsets.ISO_8859_1);

        java.io.ByteArrayOutputStream pdf = new java.io.ByteArrayOutputStream();
        java.util.List<Long> offsets = new java.util.ArrayList<>();

        try {
            pdf.write("%PDF-1.4\n".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));

            // Object 1: Catalog
            offsets.add((long) pdf.size());
            pdf.write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));

            // Object 2: Pages
            offsets.add((long) pdf.size());
            pdf.write("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));

            // Object 3: Page
            offsets.add((long) pdf.size());
            pdf.write(("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n")
                    .getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));

            // Object 4: Font Helvetica
            offsets.add((long) pdf.size());
            pdf.write("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));

            // Object 5: Font Helvetica-Bold
            offsets.add((long) pdf.size());
            pdf.write("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));

            // Object 6: Stream
            offsets.add((long) pdf.size());
            pdf.write(("6 0 obj\n<< /Length " + streamBytes.length + " >>\nstream\n").getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));
            pdf.write(streamBytes);
            pdf.write("\nendstream\nendobj\n".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));

            // Xref
            long xrefStart = pdf.size();
            pdf.write(("xref\n0 " + (offsets.size() + 1) + "\n").getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));
            pdf.write("0000000000 65535 f \n".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));
            for (Long offset : offsets) {
                String entry = String.format("%010d 00000 n \n", offset);
                pdf.write(entry.getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));
            }

            // Trailer
            pdf.write(("trailer\n<< /Size " + (offsets.size() + 1) + " /Root 1 0 R >>\n").getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));
            pdf.write("startxref\n".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));
            pdf.write((xrefStart + "\n%%EOF\n").getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));

            return pdf.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error writing PDF byte stream", e);
        }
    }

    private String escapePdf(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)")
                .replace("\r", " ")
                .replace("\n", " ");
    }

    public String storeCertificate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Certificate file size exceeds maximum permitted limit of 10MB");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "certificate.pdf"));
        if (originalFilename.contains("..")) {
            throw new BadRequestException("Invalid filename sequence: " + originalFilename);
        }

        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_CERT_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BadRequestException("Unsupported certificate file type ." + extension + ". Allowed formats: PDF, PNG, JPG, JPEG, WEBP");
        }

        String uniqueFileName = UUID.randomUUID() + "_" + originalFilename;
        Path targetLocation = this.certificateDirectory.resolve(uniqueFileName);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return targetLocation.toString();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store certificate file: " + originalFilename, ex);
        }
    }

    public Resource loadCertificateAsResource(String storedFilePath) {
        if (storedFilePath == null || storedFilePath.isBlank()) {
            throw new ResourceNotFoundException("Certificate", "path", "empty");
        }

        try {
            Path filePath = Paths.get(storedFilePath).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Certificate", "file", filePath.getFileName().toString());
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Certificate", "path", storedFilePath);
        }
    }

    private String getFileExtension(String filename) {
        int lastIndex = filename.lastIndexOf('.');
        if (lastIndex == -1 || lastIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastIndex + 1);
    }
}
