package com.orgkgi;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orgkgi.dto.learningpath.LearningProgressUpdateDto;
import com.orgkgi.entity.Course;
import com.orgkgi.entity.EmployeeProfile;
import com.orgkgi.entity.LearningPath;
import com.orgkgi.entity.LearningPathCourse;
import com.orgkgi.repository.EmployeeProfileRepository;
import com.orgkgi.repository.LearningPathCourseRepository;
import com.orgkgi.repository.LearningPathRepository;
import com.orgkgi.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class CourseRecommendationAndLearningPathTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private LearningPathRepository learningPathRepository;

    @Autowired
    private LearningPathCourseRepository learningPathCourseRepository;

    @Autowired
    private EmployeeProfileRepository employeeProfileRepository;

    @Autowired
    private com.orgkgi.repository.EmployeeSkillRepository employeeSkillRepository;

    @Autowired
    private com.orgkgi.repository.CourseRepository courseRepository;

    private String employeeDavidToken; // David Kim (Profile ID 2, User ID 4, Dept 1)
    private String employeeAlexToken;  // Alex Morgan (Profile ID 1, User ID 3, Dept 1)
    private String managerEngToken;    // Sarah Jenkins (Manager of Dept 1)

    @BeforeEach
    void setUp() {
        employeeDavidToken = "Bearer " + tokenProvider.generateTokenFromUser(4L, "david.junior@orgkgi.dev", "EMPLOYEE");
        employeeAlexToken = "Bearer " + tokenProvider.generateTokenFromUser(3L, "alex.senior@orgkgi.dev", "EMPLOYEE");
        managerEngToken = "Bearer " + tokenProvider.generateTokenFromUser(2L, "manager.eng@orgkgi.dev", "MANAGER");

        resetDavidKimBaseline();
    }

    private void resetDavidKimBaseline() {
        EmployeeProfile david = employeeProfileRepository.findById(2L).orElse(null);
        if (david == null) return;

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

        LearningPath path = learningPathRepository.findByEmployeeProfileIdAndStatus(2L, "ACTIVE").orElse(null);
        if (path == null) {
            path = new LearningPath();
            path.setEmployeeProfile(david);
            path.setTargetJobRole(david.getTargetJobRole());
            path.setTitle("Senior Software Engineer Upskilling Roadmap");
            path.setStatus("ACTIVE");
            path = learningPathRepository.save(path);
        }

        List<LearningPathCourse> courses = learningPathCourseRepository.findByLearningPathIdOrderByStepOrderAsc(path.getId());
        if (courses.isEmpty()) {
            Course c1 = courseRepository.findById(1L).orElse(null);
            Course c2 = courseRepository.findById(2L).orElse(null);
            if (c1 != null) {
                LearningPathCourse lpc1 = new LearningPathCourse();
                lpc1.setLearningPath(path);
                lpc1.setCourse(c1);
                lpc1.setStepOrder(1);
                lpc1.setStatus("IN_PROGRESS");
                lpc1.setProgressPercentage(40);
                learningPathCourseRepository.save(lpc1);
            }
            if (c2 != null) {
                LearningPathCourse lpc2 = new LearningPathCourse();
                lpc2.setLearningPath(path);
                lpc2.setCourse(c2);
                lpc2.setStepOrder(2);
                lpc2.setStatus("NOT_STARTED");
                lpc2.setProgressPercentage(0);
                learningPathCourseRepository.save(lpc2);
            }
        }
    }

    @Test
    void testGetAllCoursesWithSkillsCovered() throws Exception {
        mockMvc.perform(get("/api/v1/courses")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(4))))
                .andExpect(jsonPath("$.data[0].skillsCovered", not(empty())));
    }

    @Test
    void testDynamicCourseRecommendationsForEmployeeSkillGaps() throws Exception {
        // David Kim has skill gaps in Spring Boot, System Design, PostgreSQL
        mockMvc.perform(get("/api/v1/courses/recommendations/me")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", not(empty())))
                .andExpect(jsonPath("$.data[0].recommendationScore", greaterThan(0.0)))
                .andExpect(jsonPath("$.data[0].matchRank", is(1)))
                .andExpect(jsonPath("$.data[0].explanation", containsString("unresolved skill gap")));
    }

    @Test
    void testManagerCanViewEmployeeRecommendationsWithinDepartment() throws Exception {
        mockMvc.perform(get("/api/v1/courses/recommendations/employee/2")
                .header("Authorization", managerEngToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", not(empty())));

        // Cross-department access: Sarah (Dept 1) attempts to access Elena (Profile 3, Dept 2) -> 403
        mockMvc.perform(get("/api/v1/courses/recommendations/employee/3")
                .header("Authorization", managerEngToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGeneratePersonalizedLearningPath() throws Exception {
        mockMvc.perform(post("/api/v1/learning-paths/generate/me")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.employeeProfileId", is(2)))
                .andExpect(jsonPath("$.data.targetJobRoleTitle", is("Senior Software Engineer")))
                .andExpect(jsonPath("$.data.courses", not(empty())))
                .andExpect(jsonPath("$.data.courses[0].stepOrder", is(1)))
                .andExpect(jsonPath("$.data.courses[0].status", is("NOT_STARTED")))
                .andExpect(jsonPath("$.data.courses[0].progressPercentage", is(0)));
    }

    @Test
    void testUpdateLearningProgressAndCompletionTransitions() throws Exception {
        // 1. Generate path
        mockMvc.perform(post("/api/v1/learning-paths/generate/me")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk());

        LearningPath path = learningPathRepository.findByEmployeeProfileIdAndStatus(2L, "ACTIVE").orElseThrow();
        List<LearningPathCourse> pathCourses = learningPathCourseRepository.findByLearningPathIdOrderByStepOrderAsc(path.getId());
        assertFalse(pathCourses.isEmpty());

        Long firstCourseId = pathCourses.get(0).getCourse().getId();

        // 2. Update first course to 50%
        LearningProgressUpdateDto update50 = new LearningProgressUpdateDto(50);
        mockMvc.perform(patch("/api/v1/learning-paths/" + path.getId() + "/courses/" + firstCourseId + "/progress")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update50)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.courses[0].status", is("IN_PROGRESS")))
                .andExpect(jsonPath("$.data.courses[0].progressPercentage", is(50)));

        // 3. Complete all courses in the learning path
        for (LearningPathCourse lpc : pathCourses) {
            LearningProgressUpdateDto completeDto = new LearningProgressUpdateDto(100);
            mockMvc.perform(patch("/api/v1/learning-paths/" + path.getId() + "/courses/" + lpc.getCourse().getId() + "/progress")
                    .header("Authorization", employeeDavidToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(completeDto)))
                    .andExpect(status().isOk());
        }

        // Verify overall learning path status is now COMPLETED
        mockMvc.perform(get("/api/v1/learning-paths/" + path.getId())
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.overallProgressPercentage", is(100)))
                .andExpect(jsonPath("$.data.completedCourses", is(pathCourses.size())));
    }

    @Test
    void testInvalidProgressPercentageThrowsBadRequest() throws Exception {
        LearningPath path = learningPathRepository.findByEmployeeProfileIdAndStatus(2L, "ACTIVE").orElseThrow();
        List<LearningPathCourse> pathCourses = learningPathCourseRepository.findByLearningPathIdOrderByStepOrderAsc(path.getId());
        Long firstCourseId = pathCourses.get(0).getCourse().getId();

        LearningProgressUpdateDto invalid = new LearningProgressUpdateDto(120); // > 100
        mockMvc.perform(patch("/api/v1/learning-paths/" + path.getId() + "/courses/" + firstCourseId + "/progress")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testPreventCrossEmployeeLearningPathProgressModification() throws Exception {
        // Alex Morgan attempts to update David Kim's active learning path course progress
        LearningPath path = learningPathRepository.findByEmployeeProfileIdAndStatus(2L, "ACTIVE").orElseThrow();
        List<LearningPathCourse> pathCourses = learningPathCourseRepository.findByLearningPathIdOrderByStepOrderAsc(path.getId());
        Long firstCourseId = pathCourses.get(0).getCourse().getId();

        LearningProgressUpdateDto updateDto = new LearningProgressUpdateDto(75);
        mockMvc.perform(patch("/api/v1/learning-paths/" + path.getId() + "/courses/" + firstCourseId + "/progress")
                .header("Authorization", employeeAlexToken) // Alex Morgan, not the owner
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testManagerDepartmentIsolationForLearningPaths() throws Exception {
        // Sarah Jenkins (Manager, Dept 1) can view David Kim (Profile 2, Dept 1)
        mockMvc.perform(get("/api/v1/learning-paths/employee/2")
                .header("Authorization", managerEngToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.employeeProfileId", is(2)));

        // Sarah Jenkins (Dept 1) attempts to view Elena Rostova (Profile 3, Dept 2) -> 403
        mockMvc.perform(get("/api/v1/learning-paths/employee/3")
                .header("Authorization", managerEngToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testLearningRoadmapDynamicSyncWithAssessmentLevelsAndCertificates() throws Exception {
        // 1. Generate active learning roadmap for David Kim
        mockMvc.perform(post("/api/v1/learning-paths/generate/me")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.courses", not(empty())));

        // 2. David Kim uploads a course completion certificate for one of the courses in the roadmap
        LearningPath path = learningPathRepository.findByEmployeeProfileIdAndStatus(2L, "ACTIVE").orElseThrow();
        List<LearningPathCourse> courses = learningPathCourseRepository.findByLearningPathIdOrderByStepOrderAsc(path.getId());
        assertFalse(courses.isEmpty());

        String targetCourseTitle = courses.get(0).getCourse().getTitle();

        mockMvc.perform(multipart("/api/v1/certificates/upload")
                .file(new org.springframework.mock.web.MockMultipartFile("file", "cert.pdf", "application/pdf", "dummy certificate content".getBytes()))
                .param("courseTitle", targetCourseTitle)
                .param("courseProvider", courses.get(0).getCourse().getProvider())
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("VERIFIED")));

        // 3. Fetch David Kim's active roadmap - must reflect 100% COMPLETED for the certificate-verified course
        mockMvc.perform(get("/api/v1/learning-paths/me")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.courses[0].status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.courses[0].progressPercentage", is(100)));

        // 4. Test explicit /sync/me endpoint
        mockMvc.perform(post("/api/v1/learning-paths/sync/me")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.courses[0].status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.courses[0].progressPercentage", is(100)));
    }

    @Test
    void testEnrollAndSyncDirectlyFromExternalPlatformCourseraApi() throws Exception {
        // 1. Employee enrolls in a live Coursera course directly from platform
        com.orgkgi.dto.learningpath.PlatformCourseEnrollmentRequest enrollReq =
                new com.orgkgi.dto.learningpath.PlatformCourseEnrollmentRequest(
                        "Coursera",
                        "machine-learning",
                        "Supervised Machine Learning: Regression and Classification",
                        "https://www.coursera.org/learn/machine-learning"
                );

        mockMvc.perform(post("/api/v1/learning-paths/enroll/platform")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(enrollReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.courses", not(empty())));

        // 2. Verify course is now integrated into active learning roadmap as IN_PROGRESS
        LearningPath path = learningPathRepository.findByEmployeeProfileIdAndStatus(2L, "ACTIVE").orElseThrow();
        List<LearningPathCourse> courses = learningPathCourseRepository.findByLearningPathIdOrderByStepOrderAsc(path.getId());

        LearningPathCourse enrolledCourse = courses.stream()
                .filter(c -> c.getCourse().getTitle().contains("Machine Learning"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Enrolled platform course was not found in active roadmap"));

        assertTrue("ENROLLED".equals(enrolledCourse.getStatus()) || "IN_PROGRESS".equals(enrolledCourse.getStatus()));
        assertTrue(enrolledCourse.getProgressPercentage() >= 25);

        // 3. Employee completes course on Coursera and platform progress/credential is verified
        com.orgkgi.dto.learningpath.PlatformCourseVerificationRequest verifyReq =
                new com.orgkgi.dto.learningpath.PlatformCourseVerificationRequest(
                        "Coursera",
                        "https://www.coursera.org/account/accomplishments/verify/MLCERT123XYZ"
                );

        mockMvc.perform(post("/api/v1/learning-paths/courses/" + enrolledCourse.getCourse().getId() + "/verify-platform")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 4. Fetch roadmap - must reflect 100% COMPLETED directly from the external platform
        mockMvc.perform(get("/api/v1/learning-paths/me")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk());

        LearningPathCourse completedCourse = learningPathCourseRepository
                .findByLearningPathIdAndCourseId(path.getId(), enrolledCourse.getCourse().getId())
                .orElseThrow();

        assertEquals("COMPLETED", completedCourse.getStatus());
        assertEquals(100, completedCourse.getProgressPercentage());
        assertNotNull(completedCourse.getCompletedAt());

        // 5. Also verify bulk platform sync endpoint (both /sync/platform and /sync-platform)
        mockMvc.perform(post("/api/v1/learning-paths/sync/platform")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(post("/api/v1/learning-paths/sync-platform")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    void testCheckPlatformOnlyMarksAsEnrolledNotCompleted() throws Exception {
        // Enrolling in a course via platform
        com.orgkgi.dto.learningpath.PlatformCourseEnrollmentRequest enrollReq =
                new com.orgkgi.dto.learningpath.PlatformCourseEnrollmentRequest(
                        "Coursera",
                        "deep-neural-networks",
                        "Improving Deep Neural Networks",
                        "https://www.coursera.org/learn/deep-neural-networks"
                );

        mockMvc.perform(post("/api/v1/learning-paths/enroll/platform")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(enrollReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        LearningPath path = learningPathRepository.findByEmployeeProfileIdAndStatus(2L, "ACTIVE").orElseThrow();
        List<LearningPathCourse> courses = learningPathCourseRepository.findByLearningPathIdOrderByStepOrderAsc(path.getId());
        LearningPathCourse targetCourse = courses.stream()
                .filter(c -> c.getCourse().getTitle().contains("Improving Deep Neural Networks"))
                .findFirst()
                .orElseThrow();

        // Calling "verify-platform" WITHOUT a credential URL (simulates user clicking "Check Platform")
        com.orgkgi.dto.learningpath.PlatformCourseVerificationRequest emptyCheck =
                new com.orgkgi.dto.learningpath.PlatformCourseVerificationRequest("Coursera", "");

        mockMvc.perform(post("/api/v1/learning-paths/courses/" + targetCourse.getCourse().getId() + "/verify-platform")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emptyCheck)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Verify status in DB: MUST be ENROLLED with progress around 25%, NEVER COMPLETED (100%)
        LearningPathCourse updatedLpc = learningPathCourseRepository
                .findByLearningPathIdAndCourseId(path.getId(), targetCourse.getCourse().getId())
                .orElseThrow();

        assertEquals("ENROLLED", updatedLpc.getStatus());
        assertEquals(25, updatedLpc.getProgressPercentage());
        assertNull(updatedLpc.getCompletedAt(), "Course must not have completedAt set when merely enrolled");
    }
}
