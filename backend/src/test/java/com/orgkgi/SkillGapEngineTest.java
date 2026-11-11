package com.orgkgi;

import com.orgkgi.dto.skillgap.SkillGapItemDto;
import com.orgkgi.dto.skillgap.SkillGapReportDto;
import com.orgkgi.entity.EmployeeProfile;
import com.orgkgi.security.JwtTokenProvider;
import com.orgkgi.service.SkillGapService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import org.springframework.transaction.annotation.Transactional;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class SkillGapEngineTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SkillGapService skillGapService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private String employeeDavidToken; // David Kim (Profile ID 2, User ID 4, Dept 1)
    private String managerEngToken;    // Sarah Jenkins (Manager of Dept 1)

    @Autowired
    private com.orgkgi.repository.EmployeeProfileRepository employeeProfileRepository;

    @Autowired
    private com.orgkgi.repository.EmployeeSkillRepository employeeSkillRepository;

    @BeforeEach
    void setUp() {
        employeeDavidToken = "Bearer " + tokenProvider.generateTokenFromUser(4L, "david.junior@orgkgi.dev", "EMPLOYEE");
        managerEngToken = "Bearer " + tokenProvider.generateTokenFromUser(2L, "manager.eng@orgkgi.dev", "MANAGER");

        resetDavidKimBaseline();
    }

    private void resetDavidKimBaseline() {
        employeeSkillRepository.findByEmployeeProfileIdAndSkillId(2L, 1L).ifPresent(s -> {
            s.setCurrentProficiencyLevel(3);
            s.setVerifiedProficiencyLevel(2);
            s.setVerificationStatus(com.orgkgi.entity.VerificationStatus.ASSESSED);
            employeeSkillRepository.save(s);
        });
        employeeSkillRepository.findByEmployeeProfileIdAndSkillId(2L, 2L).ifPresent(s -> {
            s.setCurrentProficiencyLevel(2);
            s.setVerifiedProficiencyLevel(1);
            s.setVerificationStatus(com.orgkgi.entity.VerificationStatus.SELF_REPORTED);
            employeeSkillRepository.save(s);
        });
        employeeSkillRepository.findByEmployeeProfileIdAndSkillId(2L, 4L).ifPresent(s -> {
            s.setCurrentProficiencyLevel(2);
            s.setVerifiedProficiencyLevel(2);
            s.setVerificationStatus(com.orgkgi.entity.VerificationStatus.ASSESSED);
            employeeSkillRepository.save(s);
        });
        employeeSkillRepository.findByEmployeeProfileIdAndSkillId(2L, 3L).ifPresent(s -> {
            s.setCurrentProficiencyLevel(1);
            s.setVerifiedProficiencyLevel(1);
            s.setVerificationStatus(com.orgkgi.entity.VerificationStatus.SELF_REPORTED);
            employeeSkillRepository.save(s);
        });
    }

    @Test
    void testSkillGapArithmeticAndWeightingForDavidKim() {
        // David Kim (Profile ID 2) is a Junior SWE targeting Senior SWE
        EmployeeProfile david = employeeProfileRepository.findById(2L).orElseThrow();
        SkillGapReportDto report = skillGapService.generateReport(david);

        assertNotNull(report);
        assertEquals(2L, report.getEmployeeProfileId());
        assertEquals("David Kim", report.getEmployeeFullName());
        assertEquals("Senior Software Engineer", report.getTargetJobRoleTitle());
        assertEquals(5, report.getTotalRequiredSkills());

        // Verify that gaps are calculated deterministically
        assertTrue(report.getTotalWeightedGap() > 0, "David should have positive weighted gap targeting Senior SWE");

        // Find Spring Boot Framework (Skill 2: Req 4, Weight 3.0, Self-Reported 2 / Verified 1)
        Optional<SkillGapItemDto> springGapOpt = report.getSkillGaps().stream()
            .filter(g -> "SKL_SPRING".equals(g.getSkillCode()))
            .findFirst();

        assertTrue(springGapOpt.isPresent());
        SkillGapItemDto springGap = springGapOpt.get();
        assertEquals(4, springGap.getRequiredProficiency());
        assertEquals(2.9, springGap.getImportanceWeight(), 0.1);
        assertTrue(springGap.getIsDynamicWeight());
        assertEquals("MANDATORY", springGap.getCriticality());
    }

    @Test
    void testVerifiedVsSelfReportedProficiencyDistinction() {
        EmployeeProfile david = employeeProfileRepository.findById(2L).orElseThrow();
        SkillGapReportDto report = skillGapService.generateReport(david);

        // In seeded data:
        // David Kim has:
        // - Java (Skill 1): Verified Level 2 (Status ASSESSED) -> Should be VERIFIED
        // - System Design (Skill 3): Level 1 (Status SELF_REPORTED) -> Should be UNVERIFIED_SELF_REPORTED
        Optional<SkillGapItemDto> javaSkill = report.getSkillGaps().stream()
            .filter(g -> "SKL_JAVA".equals(g.getSkillCode()))
            .findFirst();
        assertTrue(javaSkill.isPresent());
        assertEquals("VERIFIED", javaSkill.get().getAssessmentStatus());
        assertEquals(2, javaSkill.get().getVerifiedProficiency());
        assertEquals(2, javaSkill.get().getRawGap()); // 4 req - 2 verified = 2
        assertEquals(5.8, javaSkill.get().getWeightedGap(), 0.1); // 2 * 2.9 = 5.8

        Optional<SkillGapItemDto> sysDesignSkill = report.getSkillGaps().stream()
            .filter(g -> "SKL_SYS_DESIGN".equals(g.getSkillCode()))
            .findFirst();
        assertTrue(sysDesignSkill.isPresent());
        assertEquals("UNVERIFIED_SELF_REPORTED", sysDesignSkill.get().getAssessmentStatus());
        assertNull(sysDesignSkill.get().getVerifiedProficiency(), "Unverified self-reported skill must not have verified proficiency");
        assertNull(sysDesignSkill.get().getRawGap(), "Unverified self-reported skill must not compute certified raw gap");
        assertNull(sysDesignSkill.get().getWeightedGap(), "Unverified self-reported skill must not compute certified weighted gap");
        assertEquals(1, sysDesignSkill.get().getSelfReportedProficiency());
    }

    @Test
    void testUnassessedSkillsHandledCleanly() {
        EmployeeProfile david = employeeProfileRepository.findById(2L).orElseThrow();
        SkillGapReportDto report = skillGapService.generateReport(david);

        // Docker (Skill 7: Req 3, Weight 1.0) was NOT seeded for David Kim -> Should be UNASSESSED
        Optional<SkillGapItemDto> dockerSkill = report.getSkillGaps().stream()
            .filter(g -> "SKL_DOCKER".equals(g.getSkillCode()))
            .findFirst();
        assertTrue(dockerSkill.isPresent());
        assertEquals("UNASSESSED", dockerSkill.get().getAssessmentStatus());
        assertNull(dockerSkill.get().getVerifiedProficiency());
        assertNull(dockerSkill.get().getSelfReportedProficiency());
        assertNull(dockerSkill.get().getRawGap());
        assertNull(dockerSkill.get().getWeightedGap());
    }

    @Test
    void testGetOwnSkillGapReportApiEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/skills/gaps/me")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.employeeProfileId", is(2)))
                .andExpect(jsonPath("$.data.targetJobRoleTitle", is("Senior Software Engineer")))
                .andExpect(jsonPath("$.data.skillGaps", not(empty())))
                .andExpect(jsonPath("$.data.totalWeightedGap", greaterThan(0.0)));
    }

    @Test
    void testManagerAccessingSkillGapWithinDepartmentSucceeds() throws Exception {
        // Manager Sarah Jenkins accesses David Kim (Dept 1)
        mockMvc.perform(get("/api/v1/skills/gaps/employee/2")
                .header("Authorization", managerEngToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.employeeProfileId", is(2)));
    }

    @Test
    void testManagerAccessingSkillGapInDifferentDepartmentReturns403() throws Exception {
        // Manager Sarah Jenkins (Dept 1) attempts to access Elena Rostova (Profile 3, Dept 2)
        mockMvc.perform(get("/api/v1/skills/gaps/employee/3")
                .header("Authorization", managerEngToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }
}
