package dev.picha.subtrack.config;

import static dev.picha.subtrack.ApiRequests.apiGet;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.picha.subtrack.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
class SpaForwardTest {

    @Autowired
    MockMvc mvc;

    @Test
    void frontendRoutesServeTheSpaWithoutASession() throws Exception {
        for (String path : new String[] { "/", "/login", "/subscriptions", "/subscriptions/new",
                "/subscriptions/42", "/settings" }) {
            mvc.perform(get(path)).andExpect(status().isOk()).andExpect(forwardedUrl("/index.html"));
        }
    }

    @Test
    void unknownApiRoutesAreNotForwarded() throws Exception {
        mvc.perform(apiGet("/api/nope")).andExpect(status().isNotFound());
    }
}
