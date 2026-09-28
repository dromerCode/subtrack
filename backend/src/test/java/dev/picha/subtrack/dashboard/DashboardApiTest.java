package dev.picha.subtrack.dashboard;

import static dev.picha.subtrack.ApiRequests.apiGet;
import static dev.picha.subtrack.ApiRequests.apiPost;
import static dev.picha.subtrack.ApiRequests.idOf;
import static dev.picha.subtrack.ApiRequests.subscriptionJson;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.picha.subtrack.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
class DashboardApiTest {

    @Autowired
    MockMvc mvc;

    private void create(String json) throws Exception {
        mvc.perform(apiPost("/api/subscriptions", json)).andExpect(status().isCreated());
    }

    @Test
    void totalsUpcomingAndByCategory() throws Exception {
        long streaming = idOf(mvc.perform(apiPost("/api/categories", "{\"name\": \"Streaming\"}")).andReturn());
        // 15.00/month → 180/year; charges 01-20 (02-20 is outside the window)
        create(subscriptionJson("Netflix", "15.00", 1, "MONTH", "2026-01-20", 1, streaming, true));
        // 18.00 / 3 = 6.00/month → 72/year; next charge 02-01
        create(subscriptionJson("Spotify", "18.00", 1, "MONTH", "2025-12-01", 3, null, true));
        // 7.00 every 2 weeks → 182/year; charges 01-24 and 02-07
        create(subscriptionJson("Gym", "7.00", 2, "WEEK", "2026-01-10", 1, null, true));
        // inactive: ignored everywhere
        create(subscriptionJson("Old", "99.00", 1, "MONTH", "2026-01-16", 1, streaming, false));

        mvc.perform(apiGet("/api/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.yearlyTotal").value(434.0))
            .andExpect(jsonPath("$.monthlyTotal").value(36.17))
            .andExpect(jsonPath("$.upcoming[*].name", contains("Netflix", "Gym", "Spotify", "Gym")))
            .andExpect(jsonPath("$.upcoming[*].date", contains("2026-01-20", "2026-01-24", "2026-02-01", "2026-02-07")))
            .andExpect(jsonPath("$.upcoming[*].yourShare", contains(15.0, 7.0, 6.0, 7.0)))
            .andExpect(jsonPath("$.byCategory[0].categoryId").value(nullValue()))
            .andExpect(jsonPath("$.byCategory[0].name").value(nullValue()))
            .andExpect(jsonPath("$.byCategory[0].monthly").value(21.17))
            .andExpect(jsonPath("$.byCategory[1].categoryId").value(streaming))
            .andExpect(jsonPath("$.byCategory[1].name").value("Streaming"))
            .andExpect(jsonPath("$.byCategory[1].monthly").value(15.0));
    }

    @Test
    void totalsAreRoundedOnlyAtTheEnd() throws Exception {
        // three shares of 10/3 = 3.333… each; rounding first would give 9.99
        for (String name : new String[] { "A", "B", "C" }) {
            create(subscriptionJson(name, "10.00", 1, "MONTH", "2026-02-20", 3, null, true));
        }

        mvc.perform(apiGet("/api/dashboard"))
            .andExpect(jsonPath("$.monthlyTotal").value(10.0))
            .andExpect(jsonPath("$.yearlyTotal").value(120.0));
    }

    @Test
    void emptyDashboard() throws Exception {
        mvc.perform(apiGet("/api/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.monthlyTotal").value(0.0))
            .andExpect(jsonPath("$.yearlyTotal").value(0.0))
            .andExpect(jsonPath("$.upcoming").isEmpty())
            .andExpect(jsonPath("$.byCategory").isEmpty());
    }

    @Test
    void requiresASession() throws Exception {
        mvc.perform(get("/api/dashboard")).andExpect(status().isUnauthorized());
    }
}
