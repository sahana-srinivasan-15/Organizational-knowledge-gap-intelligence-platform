package com.orgkgi;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orgkgi.dto.employee.UpdateEmployeeProfileRequest;
import com.orgkgi.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class EmployeeProfileSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private String employeeTokenDavid; // User ID 4
    private String employeeTokenAlex;  // User ID 3

    @BeforeEach
    void setUp() {
        employeeTokenDavid = "Bearer " + tokenProvider.generateTokenFromUser(4L, "david.junior@orgkgi.dev", "EMPLOYEE");
        employeeTokenAlex = "Bearer " + tokenProvider.generateTokenFromUser(3L, "alex.senior@orgkgi.dev", "EMPLOYEE");
    }

    @Test
    void testGetOwnEmployeeProfileSucceeds() throws Exception {
        mockMvc.perform(get("/api/v1/employees/me/profile")
                .header("Authorization", employeeTokenDavid))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.userId", is(4)))
                .andExpect(jsonPath("$.data.userEmail", is("david.junior@orgkgi.dev")))
                .andExpect(jsonPath("$.data.skills", not(empty())));
    }

    @Test
    void testUpdateOwnProfileSelfServiceFieldsSucceeds() throws Exception {
        UpdateEmployeeProfileRequest request = new UpdateEmployeeProfileRequest(true, 6, 1L);

        mockMvc.perform(put("/api/v1/employees/me/profile")
                .header("Authorization", employeeTokenDavid)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.mentorOptIn", is(true)))
                .andExpect(jsonPath("$.data.mentorAvailabilityHrsPerWeek", is(6)))
                .andExpect(jsonPath("$.data.eligibleForMentorship", is(true)));
    }

    @Test
    void testUpdateProfileWithNegativeHoursFailsValidation() throws Exception {
        UpdateEmployeeProfileRequest request = new UpdateEmployeeProfileRequest(true, -5, null);

        mockMvc.perform(put("/api/v1/employees/me/profile")
                .header("Authorization", employeeTokenDavid)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.fieldErrors.mentorAvailabilityHrsPerWeek", containsString("cannot be negative")));
    }

    @Test
    void testUpdateProfileWithExcessiveHoursFailsValidation() throws Exception {
        UpdateEmployeeProfileRequest request = new UpdateEmployeeProfileRequest(true, 60, null);

        mockMvc.perform(put("/api/v1/employees/me/profile")
                .header("Authorization", employeeTokenDavid)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.fieldErrors.mentorAvailabilityHrsPerWeek", containsString("cannot exceed 40 hours")));
    }

    @Test
    void testEmployeeAccessingAnotherEmployeeProfileByIdReturns403() throws Exception {
        // David Kim (ID 4) tries to access Alex Morgan's profile (ID 3)
        mockMvc.perform(get("/api/v1/employees/3/profile")
                .header("Authorization", employeeTokenDavid))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }
}
