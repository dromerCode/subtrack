package dev.picha.subtrack.lookup;

import static dev.picha.subtrack.ApiRequests.apiDelete;
import static dev.picha.subtrack.ApiRequests.apiGet;
import static dev.picha.subtrack.ApiRequests.apiPost;
import static dev.picha.subtrack.ApiRequests.apiPut;
import static dev.picha.subtrack.ApiRequests.idOf;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.picha.subtrack.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/** Same service as categories; this only checks the wiring of /api/payment-methods. */
@IntegrationTest
class PaymentMethodApiTest {

    @Autowired
    MockMvc mvc;

    @Test
    void fullLifecycle() throws Exception {
        long id = idOf(mvc.perform(apiPost("/api/payment-methods", "{\"name\": \"Visa\"}"))
            .andExpect(status().isCreated())
            .andReturn());
        mvc.perform(apiPost("/api/payment-methods", "{\"name\": \"Visa\"}")).andExpect(status().isConflict());
        mvc.perform(apiPut("/api/payment-methods/" + id, "{\"name\": \"Visa 1234\"}")).andExpect(status().isOk());
        mvc.perform(apiGet("/api/payment-methods")).andExpect(jsonPath("$[*].name", contains("Visa 1234")));
        mvc.perform(apiDelete("/api/payment-methods/" + id)).andExpect(status().isNoContent());
        mvc.perform(apiGet("/api/payment-methods")).andExpect(jsonPath("$").isEmpty());
    }
}
