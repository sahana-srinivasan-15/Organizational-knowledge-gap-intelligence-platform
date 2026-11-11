package com.orgkgi;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class ResumePdfGenerationTest {

    @Test
    void testGenerateValidPdfStructure() throws IOException {
        byte[] pdfBytes = generateTestResumePdf(
                "David Kim",
                "david.junior@orgkgi.dev",
                "Senior Software Engineer",
                "Engineering",
                List.of("Java (Level 3 - ASSESSED)", "Spring Boot (Level 2 - SELF_REPORTED)", "PostgreSQL (Level 2 - ASSESSED)", "System Design (Level 1 - SELF_REPORTED)"),
                List.of("Spring Boot 3 Fundamentals [COMPLETED]", "Distributed Systems Architecture [IN_PROGRESS]")
        );

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500);

        String pdfString = new String(pdfBytes, StandardCharsets.ISO_8859_1);
        assertTrue(pdfString.startsWith("%PDF-1.4"), "Must start with %PDF-1.4 header");
        assertTrue(pdfString.contains("David Kim"), "Must contain employee name");
        assertTrue(pdfString.contains("Senior Software Engineer"), "Must contain target job role");
        assertTrue(pdfString.contains("%%EOF"), "Must end with %%EOF");
        assertTrue(pdfString.contains("xref"), "Must contain xref table");
        assertTrue(pdfString.contains("startxref"), "Must contain startxref");
    }

    private byte[] generateTestResumePdf(
            String fullName,
            String email,
            String jobRole,
            String department,
            List<String> skills,
            List<String> courses) throws IOException {

        ByteArrayOutputStream streamContent = new ByteArrayOutputStream();
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
        for (String skill : skills) {
            sb.append("BT\n");
            sb.append("/F1 10 Tf\n");
            sb.append("0.2 0.25 0.35 rg\n");
            sb.append("50 ").append(currentY).append(" Td\n");
            sb.append("([*]  ").append(escapePdf(skill)).append(") Tj\n");
            sb.append("ET\n");
            currentY -= 16;
        }

        // Section: Courses
        currentY -= 15;
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
        for (String course : courses) {
            sb.append("BT\n");
            sb.append("/F1 10 Tf\n");
            sb.append("0.2 0.25 0.35 rg\n");
            sb.append("50 ").append(currentY).append(" Td\n");
            sb.append("([>]  ").append(escapePdf(course)).append(") Tj\n");
            sb.append("ET\n");
            currentY -= 16;
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

        byte[] streamBytes = sb.toString().getBytes(StandardCharsets.ISO_8859_1);

        ByteArrayOutputStream pdf = new ByteArrayOutputStream();
        List<Long> offsets = new ArrayList<>();

        pdf.write("%PDF-1.4\n".getBytes(StandardCharsets.ISO_8859_1));

        // Object 1: Catalog
        offsets.add((long) pdf.size());
        pdf.write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n".getBytes(StandardCharsets.ISO_8859_1));

        // Object 2: Pages
        offsets.add((long) pdf.size());
        pdf.write("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n".getBytes(StandardCharsets.ISO_8859_1));

        // Object 3: Page
        offsets.add((long) pdf.size());
        pdf.write(("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n")
                .getBytes(StandardCharsets.ISO_8859_1));

        // Object 4: Font Helvetica
        offsets.add((long) pdf.size());
        pdf.write("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n".getBytes(StandardCharsets.ISO_8859_1));

        // Object 5: Font Helvetica-Bold
        offsets.add((long) pdf.size());
        pdf.write("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n".getBytes(StandardCharsets.ISO_8859_1));

        // Object 6: Stream
        offsets.add((long) pdf.size());
        pdf.write(("6 0 obj\n<< /Length " + streamBytes.length + " >>\nstream\n").getBytes(StandardCharsets.ISO_8859_1));
        pdf.write(streamBytes);
        pdf.write("\nendstream\nendobj\n".getBytes(StandardCharsets.ISO_8859_1));

        // Xref
        long xrefStart = pdf.size();
        pdf.write(("xref\n0 " + (offsets.size() + 1) + "\n").getBytes(StandardCharsets.ISO_8859_1));
        pdf.write("0000000000 65535 f \n".getBytes(StandardCharsets.ISO_8859_1));
        for (Long offset : offsets) {
            String entry = String.format("%010d 00000 n \n", offset);
            pdf.write(entry.getBytes(StandardCharsets.ISO_8859_1));
        }

        // Trailer
        pdf.write(("trailer\n<< /Size " + (offsets.size() + 1) + " /Root 1 0 R >>\n").getBytes(StandardCharsets.ISO_8859_1));
        pdf.write("startxref\n".getBytes(StandardCharsets.ISO_8859_1));
        pdf.write((xrefStart + "\n%%EOF\n").getBytes(StandardCharsets.ISO_8859_1));

        return pdf.toByteArray();
    }

    private String escapePdf(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)")
                .replace("\r", " ")
                .replace("\n", " ");
    }
}

