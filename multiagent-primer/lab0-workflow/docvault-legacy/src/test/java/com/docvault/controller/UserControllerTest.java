package com.docvault.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void register_newUser_returns200() throws Exception {
        String unique = "testuser_" + System.currentTimeMillis();
        String json = String.format("""
            {
                "username": "%s",
                "email": "%s@example.com",
                "password": "testpass123",
                "fullName": "Test User"
            }
            """, unique, unique);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Registration successful"))
            .andExpect(jsonPath("$.user.username").value(unique))
            .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void register_duplicateUsername_returnsBadRequest() throws Exception {
        String json = """
            {
                "username": "johndoe",
                "email": "new@example.com",
                "password": "testpass123",
                "fullName": "Another John"
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Username already exists"));
    }

    @Test
    void getProfile_existingUser_returnsProfile() throws Exception {
        mockMvc.perform(get("/api/auth/profile").param("userId", "2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.user", notNullValue()))
            .andExpect(jsonPath("$.orderCount", greaterThanOrEqualTo(0)));
    }

    @Test
    void getProfile_nonExistentUser_returns404() throws Exception {
        mockMvc.perform(get("/api/auth/profile").param("userId", "999"))
            .andExpect(status().isNotFound());
    }

    @Test
    void resetPassword_returnsSuccessRegardless() throws Exception {
        String json = """
            {"email": "nonexistent@example.com"}
            """;

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message", containsString("If that email exists")));
    }

    // DELIBERATELY MISSING:
    // - No test for login (because auth is broken for seeded users)
    // - No test for password strength validation (there is none)
    // - No test that passwordHash is excluded from responses
    // - No test for the password reset token storage (it doesn't exist)
}
