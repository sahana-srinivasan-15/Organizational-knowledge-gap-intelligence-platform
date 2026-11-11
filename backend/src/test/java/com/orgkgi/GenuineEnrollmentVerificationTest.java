package com.orgkgi;

import com.orgkgi.dto.learningpath.LearningPathDto;
import com.orgkgi.dto.learningpath.PlatformCourseEnrollmentRequest;
import com.orgkgi.dto.learningpath.PlatformCourseVerificationRequest;
import com.orgkgi.entity.*;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.repository.CourseApprovalRequestRepository;
import com.orgkgi.repository.CourseRepository;
import com.orgkgi.repository.EmployeeProfileRepository;
import com.orgkgi.repository.LearningPathCourseRepository;
import com.orgkgi.security.UserPrincipal;
import com.orgkgi.service.PlatformLearningSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class GenuineEnrollmentVerificationTest {

    @Autowired
    private PlatformLearningSyncService platformLearningSyncService;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseApprovalRequestRepository approvalRequestRepository;

    @Autowired
    private EmployeeProfileRepository employeeProfileRepository;

    @Autowired
    private LearningPathCourseRepository learningPathCourseRepository;

    @BeforeEach
    void setupSecurity() {
        // Authenticate as David Kim (User ID 4, Employee Profile 2)
        User user = new User();
        user.setId(4L);
        user.setEmail("david.junior@orgkgi.dev");
        user.setPasswordHash("$2a$10$dummyHash");
        user.setRole(Role.EMPLOYEE);
        user.setStatus(UserStatus.ACTIVE);
        UserPrincipal principal = UserPrincipal.create(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testAddingCourseFromPlatformDefaultsToNotStartedUntilActuallyEnrolled() {
        PlatformCourseEnrollmentRequest request = new PlatformCourseEnrollmentRequest();
        request.setPlatform("Coursera");
        request.setCourseSlug("advanced-postgres-modeling-ojoqu");
        request.setCourseTitle("Advanced PostgreSQL Modeling & Schemas");
        request.setCourseUrl("https://www.coursera.org/learn/advanced-postgres-modeling-ojoqu");

        LearningPathDto updatedPath = platformLearningSyncService.enrollFromPlatform(request);
        assertNotNull(updatedPath);

        // Course should be added with status NOT_STARTED and 0 progress (not falsely marked ENROLLED)
        var addedCourse = updatedPath.getCourses().stream()
                .filter(c -> "Advanced PostgreSQL Modeling & Schemas".equalsIgnoreCase(c.getCourseTitle()))
                .findFirst();

        assertTrue(addedCourse.isPresent(), "Course should be integrated into learning roadmap");
        assertEquals("NOT_STARTED", addedCourse.get().getStatus(), "Status must be NOT_STARTED until genuine enrollment");
        assertEquals(0, addedCourse.get().getProgressPercentage(), "Progress must be 0% until genuine enrollment");
    }

    @Test
    void testCheckPlatformRejectsUnapprovedUnenrolledCourseAndRefusesFalseEnrolledStatus() {
        // Find course 13 (System Design Interview - NOT_STARTED in David's roadmap)
        Optional<Course> courseOpt = courseRepository.findById(13L);
        if (courseOpt.isEmpty()) return;

        PlatformCourseVerificationRequest req = new PlatformCourseVerificationRequest();
        req.setPlatform("Coursera");

        // Attempting to check platform without genuine enrollment or approval must throw BadRequestException
        assertThrows(BadRequestException.class, () -> {
            platformLearningSyncService.verifyPlatformCourseProgress(13L, req);
        });
    }

    @Test
    void testSyncPlatformProgressMaintainsNotStartedForUnapprovedCourses() {
        LearningPathDto syncedPath = platformLearningSyncService.syncAllPlatformEnrollmentsForCurrentEmployee();
        assertNotNull(syncedPath);

        // Courses without approved enrollment or completion must not be marked ENROLLED
        boolean hasFalseEnrolled = syncedPath.getCourses().stream()
                .anyMatch(c -> "ENROLLED".equalsIgnoreCase(c.getStatus()) && c.getProgressPercentage() == 25);
        assertFalse(hasFalseEnrolled, "syncAllPlatformEnrollments must never falsely mark unapproved courses as ENROLLED");
    }
}

