package com.orgkgi;

import com.orgkgi.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private String adminToken;
    private String managerToken;
    private String employeeTokenDavid; // Dept 1, User ID 4
    private String employeeTokenElena; // Dept 2, User ID 5
    private String mentorToken; // Dept 1, User ID 6

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + tokenProvider.generateTokenFromUser(1L, "admin@orgkgi.dev", "ADMIN");
        managerToken = "Bearer " + tokenProvider.generateTokenFromUser(2L, "manager.eng@orgkgi.dev", "MANAGER");
        employeeTokenDavid = "Bearer " + tokenProvider.generateTokenFromUser(4L, "david.junior@orgkgi.dev", "EMPLOYEE");
        employeeTokenElena = "Bearer " + tokenProvider.generateTokenFromUser(5L, "elena.ai@orgkgi.dev", "EMPLOYEE");
        mentorToken = "Bearer " + tokenProvider.generateTokenFromUser(6L, "mentor.alex@orgkgi.dev", "MENTOR");
    }

    @Test
    void testUnauthenticatedRequestToUsersMeReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    void testUnauthenticatedRequestToAdminEndpointsReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));
    }

    @Test
    void testEmployeeAccessingAdminEndpointReturns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", employeeTokenDavid))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.error", is("Forbidden")));
    }

    @Test
    void testManagerAccessingAdminEndpointReturns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", managerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    void testAdminAccessingAdminEndpointSucceeds() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", not(empty())))
                .andExpect(jsonPath("$.data.totalElements", greaterThanOrEqualTo(5)));
    }

    @Test
    void testEmployeeAccessingOwnProfileSucceeds() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", employeeTokenDavid))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(4)))
                .andExpect(jsonPath("$.data.email", is("david.junior@orgkgi.dev")));
    }

    @Test
    void testEmployeeAccessingAnotherEmployeeReturns403() throws Exception {
        // David Kim (ID 4) tries to access Alex Morgan (ID 3)
        mockMvc.perform(get("/api/v1/users/3")
                .header("Authorization", employeeTokenDavid))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", containsString("Employees can only access their own profile")));
    }

    @Test
    void testManagerAccessingEmployeeInSameDepartmentSucceeds() throws Exception {
        // Sarah Jenkins (Manager of Dept 1) accesses Alex Morgan (ID 3, Dept 1)
        mockMvc.perform(get("/api/v1/users/3")
                .header("Authorization", managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(3)))
                .andExpect(jsonPath("$.data.departmentId", is(1)));
    }

    @Test
    void testManagerAccessingEmployeeInDifferentDepartmentReturns403() throws Exception {
        // Sarah Jenkins (Manager of Dept 1) tries to access Elena Rostova (ID 5, Dept 2)
        mockMvc.perform(get("/api/v1/users/5")
                .header("Authorization", managerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", containsString("Managers can only access employees within their department")));
    }

    @Test
    void testAdminAccessingAnyUserSucceeds() throws Exception {
        // Admin accesses Elena Rostova (Dept 2)
        mockMvc.perform(get("/api/v1/users/5")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(5)));
    }

    @Test
    void testMentorAccessingAdminEndpointReturns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", mentorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    void testMentorAccessingOwnProfileSucceeds() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", mentorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("mentor.alex@orgkgi.dev")))
                .andExpect(jsonPath("$.data.role", is("MENTOR")));
    }

    @Test
    void testMentorAccessingEmployeeInSameDepartmentSucceeds() throws Exception {
        // Mentor Alex (Dept 1) accesses mentee David Kim (ID 4, Dept 1)
        mockMvc.perform(get("/api/v1/users/4")
                .header("Authorization", mentorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(4)));
    }

    @Test
    void testMentorAccessingEmployeeInDifferentDepartmentReturns403() throws Exception {
        // Mentor Alex (Dept 1) tries to access Elena Rostova (ID 5, Dept 2)
        mockMvc.perform(get("/api/v1/users/5")
                .header("Authorization", mentorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }
}
