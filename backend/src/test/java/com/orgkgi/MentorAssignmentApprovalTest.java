package com.orgkgi;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orgkgi.dto.mentorship.CreateAssignmentRequest;
import com.orgkgi.dto.mentorship.MentorAssignmentDto;
import com.orgkgi.dto.mentorship.RejectAssignmentRequest;
import com.orgkgi.entity.*;
import com.orgkgi.exception.MentorCapacityExceededException;
import com.orgkgi.repository.EmployeeProfileRepository;
import com.orgkgi.repository.MentorAssignmentRepository;
import com.orgkgi.repository.UserRepository;
import com.orgkgi.security.JwtTokenProvider;
import com.orgkgi.security.UserPrincipal;
import com.orgkgi.service.MentorAssignmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class MentorAssignmentApprovalTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MentorAssignmentService assignmentService;

    @Autowired
    private EmployeeProfileRepository employeeProfileRepository;

    @Autowired
    private MentorAssignmentRepository assignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private String managerEngToken;  // Sarah Jenkins (Manager of Dept 1)
    private String managerOtherToken; // Manager of Dept 2
    private String adminToken;

    @BeforeEach
    void setUp() {
        managerEngToken = "Bearer " + tokenProvider.generateTokenFromUser(2L, "manager.eng@orgkgi.dev", "MANAGER");
        adminToken = "Bearer " + tokenProvider.generateTokenFromUser(1L, "admin@orgkgi.dev", "ADMIN");

        // Token for manager of Dept 2
        managerOtherToken = "Bearer " + tokenProvider.generateTokenFromUser(99L, "manager.dai@orgkgi.dev", "MANAGER");

        resetPristineState();
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        resetPristineState();
    }

    private void resetPristineState() {
        assignmentRepository.findAll().stream()
            .filter(a -> a.getId() > 1L)
            .forEach(assignmentRepository::delete);

        assignmentRepository.findById(1L).ifPresent(a -> {
            a.setStatus(MentorAssignmentStatus.RECOMMENDED);
            assignmentRepository.save(a);
        });

        EmployeeProfile alex = employeeProfileRepository.findById(1L).orElse(null);
        if (alex != null) {
            alex.setCurrentMenteeCount(0);
            alex.setMaxMentees(3);
            employeeProfileRepository.save(alex);
        }
    }

    @Test
    void testManagerApprovalWorkflowSucceeds() throws Exception {
        // Reset mentor Alex Morgan capacity
        EmployeeProfile alex = employeeProfileRepository.findById(1L).orElseThrow();
        alex.setCurrentMenteeCount(0);
        alex.setMaxMentees(3);
        employeeProfileRepository.save(alex);

        // Delete any pre-existing assignments for mentee 2, mentor 1, skill 1
        assignmentRepository.findByMenteeId(2L).stream()
            .filter(a -> a.getSkill().getId().equals(1L))
            .forEach(assignmentRepository::delete);

        // 1. Create a recommendation: David Kim (2), Alex Morgan (1), Java (1)
        CreateAssignmentRequest createReq = new CreateAssignmentRequest(2L, 1L, 1L, "Upskilling Java concurrency");
        MentorAssignmentDto created = assignmentService.createRecommendationOrRequest(createReq);
        assertNotNull(created.getId());
        assertEquals(MentorAssignmentStatus.RECOMMENDED, created.getStatus());

        // 2. Manager approves the assignment
        mockMvc.perform(put("/api/v1/mentorship/assignments/" + created.getId() + "/approve")
                .header("Authorization", managerEngToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("APPROVED_BY_MANAGER")))
                .andExpect(jsonPath("$.data.managerFullName", is("Sarah Jenkins")));

        // 3. Verify mentor's active mentee count incremented
        EmployeeProfile updatedAlex = employeeProfileRepository.findById(1L).orElseThrow();
        assertEquals(1, updatedAlex.getCurrentMenteeCount());
    }

    @Test
    void testManagerRejectWorkflowSucceeds() throws Exception {
        // Reset mentor Alex Morgan capacity
        EmployeeProfile alex = employeeProfileRepository.findById(1L).orElseThrow();
        alex.setCurrentMenteeCount(0);
        alex.setMaxMentees(3);
        employeeProfileRepository.save(alex);

        // Delete any pre-existing assignments for mentee 2, mentor 1, skill 4
        assignmentRepository.findByMenteeId(2L).stream()
            .filter(a -> a.getSkill().getId().equals(4L))
            .forEach(assignmentRepository::delete);

        CreateAssignmentRequest createReq = new CreateAssignmentRequest(2L, 1L, 4L, "Postgres optimization mentoring");
        MentorAssignmentDto created = assignmentService.createRecommendationOrRequest(createReq);

        RejectAssignmentRequest rejectReq = new RejectAssignmentRequest("Mentor workload currently reserved for Q4 release.");

        mockMvc.perform(put("/api/v1/mentorship/assignments/" + created.getId() + "/reject")
                .header("Authorization", managerEngToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("REJECTED")))
                .andExpect(jsonPath("$.data.notes", containsString("Mentor workload currently reserved")));
    }

    @Test
    void testManagerCannotApproveAssignmentOutsideDepartment() throws Exception {
        // Create an assignment for Elena Rostova (Profile 3, Dept 2)
        // Manager Sarah Jenkins is in Dept 1 and must be rejected with 403 Forbidden
        // Find or create assignment for mentee 3
        assignmentRepository.findByMenteeId(3L).forEach(assignmentRepository::delete);

        CreateAssignmentRequest createReq = new CreateAssignmentRequest(3L, 1L, 7L, "Docker mentoring for Elena");
        MentorAssignmentDto created = assignmentService.createRecommendationOrRequest(createReq);

        mockMvc.perform(put("/api/v1/mentorship/assignments/" + created.getId() + "/approve")
                .header("Authorization", managerEngToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", containsString("Managers can only approve mentor assignments within their authorized department")));
    }

    @Test
    void testDuplicateActiveAssignmentIsPrevented() throws Exception {
        // Already seeded assignment: Mentee 2, Mentor 1, Skill 2
        CreateAssignmentRequest duplicateReq = new CreateAssignmentRequest(2L, 1L, 2L, "Duplicate recommendation attempt");

        mockMvc.perform(post("/api/v1/mentorship/assignments/recommend")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    void testConcurrentApprovalsPreventMentorOverbooking() throws Exception {
        // Set Alex Morgan to have exactly 1 slot remaining: currentMenteeCount = 2, maxMentees = 3
        EmployeeProfile alex = employeeProfileRepository.findById(1L).orElseThrow();
        alex.setCurrentMenteeCount(2);
        alex.setMaxMentees(3);
        employeeProfileRepository.save(alex);

        // Delete any existing assignments on skills 1 and 4 for mentee 2
        assignmentRepository.findByMenteeId(2L).stream()
            .filter(a -> a.getSkill().getId().equals(1L) || a.getSkill().getId().equals(4L))
            .forEach(assignmentRepository::delete);

        // Create 2 separate pending recommendations targeting Alex Morgan
        CreateAssignmentRequest req1 = new CreateAssignmentRequest(2L, 1L, 1L, "Candidate slot 1");
        CreateAssignmentRequest req2 = new CreateAssignmentRequest(2L, 1L, 4L, "Candidate slot 2");

        MentorAssignmentDto assign1 = assignmentService.createRecommendationOrRequest(req1);
        MentorAssignmentDto assign2 = assignmentService.createRecommendationOrRequest(req2);

        int numberOfThreads = 2;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger capacityExceededCount = new AtomicInteger(0);

        UserPrincipal managerPrincipal = new UserPrincipal(
            2L, "manager.eng@orgkgi.dev", "", Role.MANAGER, 1L, true,
            java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_MANAGER"))
        );

        // Thread 1 attempts to approve assign1
        executorService.submit(() -> {
            try {
                org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        managerPrincipal, null, managerPrincipal.getAuthorities()
                    )
                );
                startLatch.await();
                assignmentService.approveAssignment(assign1.getId());
                successCount.incrementAndGet();
            } catch (MentorCapacityExceededException e) {
                capacityExceededCount.incrementAndGet();
            } catch (Exception e) {
                // other exception
            } finally {
                endLatch.countDown();
            }
        });

        // Thread 2 attempts to approve assign2
        executorService.submit(() -> {
            try {
                org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        managerPrincipal, null, managerPrincipal.getAuthorities()
                    )
                );
                startLatch.await();
                assignmentService.approveAssignment(assign2.getId());
                successCount.incrementAndGet();
            } catch (MentorCapacityExceededException e) {
                capacityExceededCount.incrementAndGet();
            } catch (Exception e) {
                // other exception
            } finally {
                endLatch.countDown();
            }
        });

        // Release both threads simultaneously to simulate true race condition
        startLatch.countDown();
        boolean completed = endLatch.await(5, TimeUnit.SECONDS);
        executorService.shutdown();

        assertTrue(completed, "Concurrent threads should complete within timeout");

        // Exactly ONE approval must succeed, and the other must be rejected due to capacity!
        assertEquals(1, successCount.get(), "Exactly one concurrent approval must succeed");
        assertEquals(1, capacityExceededCount.get(), "The competing concurrent approval must fail with MentorCapacityExceededException");

        // Verify that Alex Morgan's final mentee count is exactly 3 (maxMentees), NEVER 4!
        EmployeeProfile finalAlex = employeeProfileRepository.findById(1L).orElseThrow();
        assertEquals(3, finalAlex.getCurrentMenteeCount(), "Mentor must never be overbooked beyond maxMentees");
    }
}
