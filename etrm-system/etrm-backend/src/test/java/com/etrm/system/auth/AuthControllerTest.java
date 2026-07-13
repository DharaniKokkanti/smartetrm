package com.etrm.system.auth;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers POST /api/v1/auth/login. Uses the real j.smith / DevTest123!
 * credentials set up earlier this session (a real bcrypt hash, unlike the
 * other seeded users' placeholder hashes) — see database/test-data/.
 */
class AuthControllerTest extends ApiTestBase {

    @Test
    void login_with_correct_credentials_returns_a_token() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("username", "j.smith", "password", "DevTest123!"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.username").value("j.smith"));
    }

    @Test
    void login_with_wrong_password_returns_401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("username", "j.smith", "password", "wrong-password"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_with_unknown_username_returns_401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("username", "no-such-user-" + unique(), "password", "whatever"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_endpoint_does_not_require_a_token() throws Exception {
        // /auth/** is explicitly permitAll in SecurityConfig — this just
        // confirms the request isn't rejected before it even reaches the
        // controller (a 401 for bad creds still proves that; this test's
        // real job is documentation of the security exemption).
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("username", "j.smith", "password", "DevTest123!"))))
                .andExpect(status().isOk());
    }
}
