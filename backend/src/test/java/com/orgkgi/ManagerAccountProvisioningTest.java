package com.orgkgi;

import com.orgkgi.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ManagerAccountProvisioningTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private String managerToken;
    private String adminToken;
    private String employeeToken;

    @BeforeEach
    void setUp() {
        managerToken = "Bearer " + tokenProvider.generateTokenFromUser(2L, "manager.eng@orgkgi.dev", "MANAGER");
        adminToken = "Bearer " + tokenProvider.generateTokenFromUser(1L, "admin@orgkgi.dev", "ADMIN");
        employeeToken = "Bearer " + tokenProvider.generateTokenFromUser(4L, "david.junior@orgkgi.dev", "EMPLOYEE");
    }

    @Test
    void testManagerCanProvisionEmployeeAccountWithResume() throws Exception {
        String uniqueEmail = "new.engineer." + System.currentTimeMillis() + "@orgkgi.dev";

        MockMultipartFile resumeFile = new MockMultipartFile(
                "resume",
                "candidate_resume.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "Sample PDF content for candidate resume testing".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/manager/employees")
                .file(resumeFile)
                .param("firstName", "Priya")
                .param("lastName", "Raman")
                .param("email", uniqueEmail)
                .param("password", "Password@123")
                .param("role", "EMPLOYEE")
                .param("departmentId", "1")
                .param("currentJobRoleId", "1")
                .param("hireDate", "2026-10-28")
                .header("Authorization", managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is(uniqueEmail)))
                .andExpect(jsonPath("$.data.fullName", is("Priya Raman")))
                .andExpect(jsonPath("$.data.role", is("EMPLOYEE")))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.hasResume", is(true)))
                .andExpect(jsonPath("$.data.resumeFileName", is("candidate_resume.pdf")));
    }

    @Test
    void testManagerCannotDeactivateAccounts() throws Exception {
        // Manager cannot call admin status update endpoint - must receive 403 Forbidden
        mockMvc.perform(put("/api/v1/admin/users/4/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"INACTIVE\"}")
                .header("Authorization", managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testEmployeeCannotProvisionAccounts() throws Exception {
        MockMultipartFile resumeFile = new MockMultipartFile(
                "resume",
                "test_cv.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "CV content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/manager/employees")
                .file(resumeFile)
                .param("firstName", "Unauthorized")
                .param("lastName", "User")
                .param("email", "hacker@orgkgi.dev")
                .param("password", "Password@123")
                .header("Authorization", employeeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetDepartmentCatalogEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/departments")
                .header("Authorization", managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        mockMvc.perform(get("/api/v1/job-roles")
                .header("Authorization", managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }
}
