package dev.picha.subtrack.auth;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.picha.subtrack.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
class AuthApiTest {

    @Autowired
    MockMvc mvc;

    @Test
    void apiRequiresASession() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/anything")).andExpect(status().isUnauthorized());
    }

    @Test
    void loginWithRightCredentials() throws Exception {
        mvc.perform(post("/api/auth/login").param("username", "test").param("password", "secret").with(csrf()))
            .andExpect(status().isNoContent());
    }

    @Test
    void loginWithWrongPassword() throws Exception {
        mvc.perform(post("/api/auth/login").param("username", "test").param("password", "nope").with(csrf()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void loginWithoutCsrfTokenIsForbidden() throws Exception {
        mvc.perform(post("/api/auth/login").param("username", "test").param("password", "secret"))
            .andExpect(status().isForbidden());
    }

    @Test
    void meReturnsTheUsername() throws Exception {
        mvc.perform(get("/api/auth/me").with(user("test")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("test"));
    }

    @Test
    void logout() throws Exception {
        mvc.perform(post("/api/auth/logout").with(user("test")).with(csrf()))
            .andExpect(status().isNoContent());
    }
}
