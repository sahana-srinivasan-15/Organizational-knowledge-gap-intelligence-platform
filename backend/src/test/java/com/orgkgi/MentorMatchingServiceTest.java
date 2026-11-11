package com.orgkgi;

import com.orgkgi.dto.mentorship.MentorCandidateDto;
import com.orgkgi.entity.*;
import com.orgkgi.repository.*;
import com.orgkgi.security.JwtTokenProvider;
import com.orgkgi.service.MentorMatchingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class MentorMatchingServiceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MentorMatchingService matchingService;

    @Autowired
    private EmployeeProfileRepository employeeProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private EmployeeSkillRepository employeeSkillRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private String employeeDavidToken; // David Kim (Profile 2, User 4)

    @BeforeEach
    void setUp() {
        employeeDavidToken = "Bearer " + tokenProvider.generateTokenFromUser(4L, "david.junior@orgkgi.dev", "EMPLOYEE");
    }

    @Test
    void testDynamicMentorMatchingForDavidKim() {
        // David Kim (Profile ID 2) targeting Senior Software Engineer
        EmployeeProfile david = employeeProfileRepository.findById(2L).orElseThrow();
        List<MentorCandidateDto> recommendations = matchingService.findMentorRecommendations(david);

        assertNotNull(recommendations);
        assertFalse(recommendations.isEmpty(), "David Kim should have mentor recommendations");

        // Alex Morgan (Profile ID 1) should be the top recommendation
        MentorCandidateDto topCandidate = recommendations.get(0);
        assertEquals(1L, topCandidate.getMentorProfileId());
        assertEquals("Alex Morgan", topCandidate.getMentorFullName());
        assertTrue(topCandidate.getOverallScore() > 0.60, "Alex Morgan should have a high affinity score");
        assertNotNull(topCandidate.getExplanation());
        assertFalse(topCandidate.getMatchedSkills().isEmpty());

        // Verify score components
        assertTrue(topCandidate.getSkillAffinityScore() > 0.0);
        assertTrue(topCandidate.getAvailabilityScore() > 0.0);
        assertTrue(topCandidate.getCapacityScore() > 0.0);
        assertEquals(1.0, topCandidate.getDepartmentAffinityScore(), "Same department (Engineering) should give 1.0 affinity");
    }

    @Test
    void testSelfMentoringIsPrevented() {
        // Alex Morgan (Profile ID 1) queries recommendations for himself
        EmployeeProfile alex = employeeProfileRepository.findById(1L).orElseThrow();
        List<MentorCandidateDto> recommendations = matchingService.findMentorRecommendations(alex);

        // Alex Morgan must not be recommended to mentor himself
        boolean containsSelf = recommendations.stream()
            .anyMatch(r -> r.getMentorProfileId().equals(1L) || r.getMentorUserId().equals(alex.getUser().getId()));
        assertFalse(containsSelf, "Self-mentoring must be strictly prevented");
    }

    @Test
    void testFullCapacityMentorsAreExcluded() {
        // Find Alex Morgan and set capacity to 0 (current = 3, max = 3)
        EmployeeProfile alex = employeeProfileRepository.findById(1L).orElseThrow();
        alex.setCurrentMenteeCount(3);
        alex.setMaxMentees(3);
        employeeProfileRepository.save(alex);

        EmployeeProfile david = employeeProfileRepository.findById(2L).orElseThrow();
        List<MentorCandidateDto> recommendations = matchingService.findMentorRecommendations(david);

        boolean containsAlex = recommendations.stream()
            .anyMatch(r -> r.getMentorProfileId().equals(1L));
        assertFalse(containsAlex, "Full capacity mentors must be excluded from recommendations");
    }

    @Test
    void testDynamicDiscoveryOfNewlyAddedEligibleMentor() {
        Department engDept = departmentRepository.findById(1L).orElseThrow();
        Skill springSkill = skillRepository.findByCode("SKL_SPRING").orElseThrow();

        // 1. Create and save a new employee user
        User newMentorUser = new User();
        newMentorUser.setEmail("rachel.dynamic@orgkgi.dev");
        newMentorUser.setPasswordHash("$2a$10$AqkN3JMh5LA3/2ie38bqc..aYkCPAOz.lZIawDC3NPf9rQhNr7FNi");
        newMentorUser.setFirstName("Rachel");
        newMentorUser.setLastName("Torres");
        newMentorUser.setRole(Role.EMPLOYEE);
        newMentorUser.setStatus(UserStatus.ACTIVE);
        newMentorUser.setDepartment(engDept);
        User savedUser = userRepository.save(newMentorUser);

        // 2. Create profile with mentor opt-in and availability
        EmployeeProfile newProfile = new EmployeeProfile();
        newProfile.setUser(savedUser);
        newProfile.setMentorOptIn(true);
        newProfile.setMentorAvailabilityHrsPerWeek(10);
        newProfile.setCurrentMenteeCount(0);
        newProfile.setMaxMentees(4);
        EmployeeProfile savedProfile = employeeProfileRepository.save(newProfile);

        // 3. Add verified skill in Spring Boot (Level 5)
        EmployeeSkill empSkill = new EmployeeSkill();
        empSkill.setEmployeeProfile(savedProfile);
        empSkill.setSkill(springSkill);
        empSkill.setCurrentProficiencyLevel(5);
        empSkill.setVerifiedProficiencyLevel(5);
        empSkill.setVerificationStatus(VerificationStatus.MANAGER_VERIFIED);
        employeeSkillRepository.save(empSkill);

        // 4. Query recommendations for David Kim
        EmployeeProfile david = employeeProfileRepository.findById(2L).orElseThrow();
        List<MentorCandidateDto> recommendations = matchingService.findMentorRecommendations(david);

        boolean foundRachel = recommendations.stream()
            .anyMatch(r -> r.getMentorProfileId().equals(savedProfile.getId()) && "Rachel Torres".equals(r.getMentorFullName()));
        assertTrue(foundRachel, "Newly added mentor candidate must be dynamically discovered from the database");
    }

    @Test
    void testGetOwnMentorRecommendationsEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/mentorship/recommendations/me")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", not(empty())))
                .andExpect(jsonPath("$.data[0].mentorFullName", is("Alex Morgan")))
                .andExpect(jsonPath("$.data[0].overallScore", greaterThan(0.50)));
    }
}
