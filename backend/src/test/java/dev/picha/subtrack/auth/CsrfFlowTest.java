package dev.picha.subtrack.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.picha.subtrack.IntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

/**
 * The real browser flow: read XSRF-TOKEN from a response, send it back as X-XSRF-TOKEN.
 * Needs a fresh context: spring-security-test's csrf() swaps the token repository of the shared one
 * (for a session-backed one, which would also hide sessions created by the app).
 */
@IntegrationTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class CsrfFlowTest {

    @Autowired
    MockMvc mvc;

    @Test
    void cookieTokenSentBackAsHeaderAllowsLogin() throws Exception {
        Cookie xsrf = mvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized())
            .andReturn().getResponse().getCookie("XSRF-TOKEN");
        assertThat(xsrf).isNotNull();

        mvc.perform(post("/api/auth/login").cookie(xsrf).header("X-XSRF-TOKEN", xsrf.getValue())
                .param("username", "test").param("password", "secret"))
            .andExpect(status().isNoContent());

        mvc.perform(post("/api/auth/login").cookie(xsrf)
                .param("username", "test").param("password", "secret"))
            .andExpect(status().isForbidden());
    }

    @Test
    void rejectedAnonymousRequestsDoNotCreateASession() throws Exception {
        var request = mvc.perform(get("/api/subscriptions"))
            .andExpect(status().isUnauthorized())
            .andReturn().getRequest();
        assertThat(request.getSession(false)).isNull();
    }
}
