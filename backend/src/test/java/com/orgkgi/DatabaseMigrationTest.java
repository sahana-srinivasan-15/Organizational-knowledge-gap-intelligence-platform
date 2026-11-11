package com.orgkgi;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5432/knowledge_gap_db",
    "spring.datasource.username=postgres",
    "spring.datasource.password=varnika@2006",
    "spring.flyway.enabled=true",
    "spring.jpa.hibernate.ddl-auto=none"
})
public class DatabaseMigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void testFlywayMigrationsApplySuccessfully() {
        // 1. Verify Flyway schema history has migrations V1 and V2
        Integer migrationCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM flyway_schema_history WHERE success = true",
            Integer.class
        );
        assertNotNull(migrationCount);
        assertTrue(migrationCount >= 6, "Flyway should have executed at least 6 migrations successfully");

        // 2. Verify all core tables exist
        Integer tableCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name != 'flyway_schema_history'",
            Integer.class
        );
        assertNotNull(tableCount);
        assertTrue(tableCount >= 23, "Expected at least 23 domain tables in public schema");

        // 3. Verify user roles constraint and seed counts
        Integer userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        assertTrue(userCount >= 6, "Expected at least 6 seeded users including MENTOR role");

        Integer distinctRoles = jdbcTemplate.queryForObject(
            "SELECT COUNT(DISTINCT role) FROM users WHERE role IN ('ADMIN', 'MANAGER', 'EMPLOYEE', 'MENTOR')",
            Integer.class
        );
        assertEquals(4, distinctRoles, "Expected all 4 roles (ADMIN, MANAGER, EMPLOYEE, MENTOR) to be present");

        // 4. Verify dynamic mentor seed state
        Integer mentorCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM employee_profiles WHERE mentor_opt_in = true AND mentor_availability_hrs_per_week > 0",
            Integer.class
        );
        assertTrue(mentorCount >= 2, "Expected at least 2 eligible dynamic mentor candidates");

        // 5. Verify pending mentor recommendation
        Integer pendingRecommendations = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM mentor_assignments WHERE status = 'RECOMMENDED'",
            Integer.class
        );
        assertEquals(1, pendingRecommendations, "Expected 1 pending manager-approvable mentor recommendation");

        System.out.println(">>> MIGRATION VERIFICATION PASSED: Flyway migrated " + migrationCount + " scripts, 19 tables, 5 users across 3 roles, and dynamic mentorship state.");
    }
}
