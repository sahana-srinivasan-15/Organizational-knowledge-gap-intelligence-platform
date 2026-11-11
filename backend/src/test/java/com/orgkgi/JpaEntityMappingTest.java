package com.orgkgi;

import com.orgkgi.entity.*;
import com.orgkgi.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class JpaEntityMappingTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private JobRoleRepository jobRoleRepository;

    @Autowired
    private EmployeeProfileRepository employeeProfileRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private EmployeeSkillRepository employeeSkillRepository;

    @Test
    void testUserAndDepartmentMapping() {
        Optional<User> adminOpt = userRepository.findByEmail("admin@orgkgi.dev");
        assertTrue(adminOpt.isPresent(), "Admin user should exist");
        User admin = adminOpt.get();
        assertEquals(Role.ADMIN, admin.getRole());
        assertEquals(UserStatus.ACTIVE, admin.getStatus());
        assertNotNull(admin.getDepartment(), "Admin should have an associated department");
        assertEquals("ENG", admin.getDepartment().getCode());
    }

    @Test
    void testJobRoleAndDepartmentRelationship() {
        Optional<JobRole> srSweOpt = jobRoleRepository.findByCode("ROLE_SR_SWE");
        assertTrue(srSweOpt.isPresent(), "Senior SWE job role should exist");
        JobRole srSwe = srSweOpt.get();
        assertEquals("SENIOR", srSwe.getLevel());
        assertEquals("Engineering", srSwe.getDepartment().getName());
    }

    @Test
    void testEmployeeProfileMentorshipMapping() {
        // Alex Morgan (ID 3) is seeded as an active mentor candidate
        Optional<User> alexOpt = userRepository.findByEmail("alex.senior@orgkgi.dev");
        assertTrue(alexOpt.isPresent());
        Long alexId = alexOpt.get().getId();

        Optional<EmployeeProfile> profileOpt = employeeProfileRepository.findByUserId(alexId);
        assertTrue(profileOpt.isPresent());
        EmployeeProfile profile = profileOpt.get();

        assertTrue(profile.getMentorOptIn());
        assertTrue(profile.getMentorAvailabilityHrsPerWeek() > 0);
        assertTrue(profile.isEligibleForMentorship());

        List<EmployeeProfile> mentors = employeeProfileRepository.findAvailableMentorCandidates();
        assertFalse(mentors.isEmpty(), "Should find eligible mentor candidates");
    }

    @Test
    void testSkillAndCategoryMapping() {
        Optional<Skill> springOpt = skillRepository.findByCode("SKL_SPRING");
        assertTrue(springOpt.isPresent(), "Spring Boot skill should exist");
        Skill spring = springOpt.get();
        assertNotNull(spring.getCategory());
        assertEquals("Software Engineering & Backend", spring.getCategory().getName());
    }
}
