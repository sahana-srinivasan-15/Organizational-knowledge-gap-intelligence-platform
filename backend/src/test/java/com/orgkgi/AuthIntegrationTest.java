package com.orgkgi;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orgkgi.dto.auth.LoginRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testSuccessfulLoginAdmin() throws Exception {
        LoginRequest request = new LoginRequest("admin@orgkgi.dev", "Password@123");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.email", is("admin@orgkgi.dev")))
                .andExpect(jsonPath("$.data.role", is("ADMIN")))
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")));
    }

    @Test
    void testSuccessfulLoginManager() throws Exception {
        LoginRequest request = new LoginRequest("manager.eng@orgkgi.dev", "Password@123");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.email", is("manager.eng@orgkgi.dev")))
                .andExpect(jsonPath("$.data.role", is("MANAGER")));
    }

    @Test
    void testSuccessfulLoginEmployee() throws Exception {
        LoginRequest request = new LoginRequest("david.junior@orgkgi.dev", "Password@123");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.email", is("david.junior@orgkgi.dev")))
                .andExpect(jsonPath("$.data.role", is("EMPLOYEE")));
    }

    @Test
    void testSuccessfulLoginMentor() throws Exception {
        LoginRequest request = new LoginRequest("mentor.alex@orgkgi.dev", "Password@123");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.email", is("mentor.alex@orgkgi.dev")))
                .andExpect(jsonPath("$.data.role", is("MENTOR")));
    }

    @Test
    void testLoginWithWrongPasswordFails() throws Exception {
        LoginRequest request = new LoginRequest("admin@orgkgi.dev", "WrongPassword999");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")))
                .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }

    @Test
    void testLoginWithNonExistentEmailFails() throws Exception {
        LoginRequest request = new LoginRequest("nobody@orgkgi.dev", "Password@123");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    void testLoginWithEmptyFieldsFailsValidation() throws Exception {
        LoginRequest request = new LoginRequest("", "");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.fieldErrors.email", notNullValue()))
                .andExpect(jsonPath("$.fieldErrors.password", notNullValue()));
    }
}
