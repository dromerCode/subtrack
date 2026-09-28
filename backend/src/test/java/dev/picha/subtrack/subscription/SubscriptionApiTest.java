package dev.picha.subtrack.subscription;

import static dev.picha.subtrack.ApiRequests.apiDelete;
import static dev.picha.subtrack.ApiRequests.apiGet;
import static dev.picha.subtrack.ApiRequests.apiPost;
import static dev.picha.subtrack.ApiRequests.apiPut;
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
class SubscriptionApiTest {

    @Autowired
    MockMvc mvc;

    private long create(String json) throws Exception {
        return idOf(mvc.perform(apiPost("/api/subscriptions", json)).andExpect(status().isCreated()).andReturn());
    }

    private long createCategory(String name) throws Exception {
        return idOf(mvc.perform(apiPost("/api/categories", "{\"name\": \"%s\"}".formatted(name))).andReturn());
    }

    @Test
    void createReturnsTheSubscriptionWithComputedFields() throws Exception {
        mvc.perform(apiPost("/api/subscriptions",
                subscriptionJson("Netflix", "15.99", 1, "MONTH", "2026-01-20", 1, null, true)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.name").value("Netflix"))
            .andExpect(jsonPath("$.price").value(15.99))
            .andExpect(jsonPath("$.intervalCount").value(1))
            .andExpect(jsonPath("$.intervalUnit").value("MONTH"))
            .andExpect(jsonPath("$.anchorDate").value("2026-01-20"))
            .andExpect(jsonPath("$.category").value(nullValue()))
            .andExpect(jsonPath("$.paymentMethod").value(nullValue()))
            .andExpect(jsonPath("$.active").value(true))
            .andExpect(jsonPath("$.createdAt").isString())
            .andExpect(jsonPath("$.yourShare").value(15.99))
            .andExpect(jsonPath("$.monthlyCost").value(15.99))
            .andExpect(jsonPath("$.yearlyCost").value(191.88))
            .andExpect(jsonPath("$.nextChargeDate").value("2026-01-20"));
    }

    @Test
    void sharedSubscriptionCountsOnlyYourShareAndShowsItsCategory() throws Exception {
        long categoryId = createCategory("Music");

        mvc.perform(apiPost("/api/subscriptions",
                subscriptionJson("Spotify Duo", "16.00", 1, "MONTH", "2025-12-01", 2, categoryId, true)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.price").value(16.0))
            .andExpect(jsonPath("$.sharedWith").value(2))
            .andExpect(jsonPath("$.yourShare").value(8.0))
            .andExpect(jsonPath("$.yearlyCost").value(96.0))
            .andExpect(jsonPath("$.category.id").value(categoryId))
            .andExpect(jsonPath("$.category.name").value("Music"))
            .andExpect(jsonPath("$.nextChargeDate").value("2026-02-01"));
    }

    @Test
    void listShowsInactiveOnesLastWithoutNextCharge() throws Exception {
        create(subscriptionJson("Zeta", "5.00", 1, "MONTH", "2026-01-01", 1, null, true));
        create(subscriptionJson("Alpha", "5.00", 1, "MONTH", "2026-01-01", 1, null, false));
        create(subscriptionJson("Beta", "5.00", 1, "MONTH", "2026-01-01", 1, null, true));

        mvc.perform(apiGet("/api/subscriptions"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].name", contains("Beta", "Zeta", "Alpha")))
            .andExpect(jsonPath("$[2].nextChargeDate").value(nullValue()));
    }

    @Test
    void getOne() throws Exception {
        long id = create(subscriptionJson("Netflix", "15.99", 1, "MONTH", "2026-01-20", 1, null, true));

        mvc.perform(apiGet("/api/subscriptions/" + id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Netflix"));
    }

    @Test
    void putReplacesTheWholeSubscription() throws Exception {
        long id = create(subscriptionJson("Netflix", "15.99", 1, "MONTH", "2026-01-20", 1, null, true));

        mvc.perform(apiPut("/api/subscriptions/" + id,
                subscriptionJson("Netflix Premium", "19.99", 1, "YEAR", "2026-03-01", 1, null, false)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Netflix Premium"))
            .andExpect(jsonPath("$.intervalUnit").value("YEAR"))
            .andExpect(jsonPath("$.active").value(false))
            .andExpect(jsonPath("$.nextChargeDate").value(nullValue()));
    }

    @Test
    void deleteThenNotFound() throws Exception {
        long id = create(subscriptionJson("Netflix", "15.99", 1, "MONTH", "2026-01-20", 1, null, true));

        mvc.perform(apiDelete("/api/subscriptions/" + id)).andExpect(status().isNoContent());
        mvc.perform(apiGet("/api/subscriptions/" + id)).andExpect(status().isNotFound());
        mvc.perform(apiPut("/api/subscriptions/" + id,
                subscriptionJson("X", "1.00", 1, "MONTH", "2026-01-20", 1, null, true)))
            .andExpect(status().isNotFound());
        mvc.perform(apiDelete("/api/subscriptions/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void validationErrorsUseCodes() throws Exception {
        mvc.perform(apiPost("/api/subscriptions", """
                {"name": " ", "price": 0, "intervalCount": 0, "intervalUnit": null, "anchorDate": null,
                 "sharedWith": 0, "notes": "%s", "active": null}
                """.formatted("x".repeat(1001))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.title").value("Validation failed"))
            .andExpect(jsonPath("$.errors[?(@.field == 'name')].code", contains("notBlank")))
            .andExpect(jsonPath("$.errors[?(@.field == 'price')].code", contains("positive")))
            .andExpect(jsonPath("$.errors[?(@.field == 'intervalCount')].code", contains("min")))
            .andExpect(jsonPath("$.errors[?(@.field == 'intervalUnit')].code", contains("notNull")))
            .andExpect(jsonPath("$.errors[?(@.field == 'anchorDate')].code", contains("notNull")))
            .andExpect(jsonPath("$.errors[?(@.field == 'sharedWith')].code", contains("min")))
            .andExpect(jsonPath("$.errors[?(@.field == 'notes')].code", contains("size")))
            .andExpect(jsonPath("$.errors[?(@.field == 'active')].code", contains("notNull")));
    }

    @Test
    void priceWithMoreThanTwoDecimalsIsRejected() throws Exception {
        mvc.perform(apiPost("/api/subscriptions",
                subscriptionJson("Netflix", "15.999", 1, "MONTH", "2026-01-20", 1, null, true)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[?(@.field == 'price')].code", contains("digits")));
    }

    @Test
    void hugeIntervalCountIsAValidationErrorNotAServerError() throws Exception {
        mvc.perform(apiPost("/api/subscriptions",
                subscriptionJson("Forever", "1.00", 1_000_000, "YEAR", "2026-01-20", 1, null, true)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[?(@.field == 'intervalCount')].code", contains("max")));
    }

    @Test
    void unknownCategoryIsAFieldError() throws Exception {
        mvc.perform(apiPost("/api/subscriptions",
                subscriptionJson("Netflix", "15.99", 1, "MONTH", "2026-01-20", 1, 999L, true)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("categoryId"))
            .andExpect(jsonPath("$.errors[0].code").value("notFound"));
    }

    @Test
    void unknownIntervalUnitIsAMalformedRequest() throws Exception {
        mvc.perform(apiPost("/api/subscriptions",
                subscriptionJson("Netflix", "15.99", 1, "HOUR", "2026-01-20", 1, null, true)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void deletingItsCategoryLeavesTheSubscriptionWithoutOne() throws Exception {
        long categoryId = createCategory("Streaming");
        long id = create(subscriptionJson("Netflix", "15.99", 1, "MONTH", "2026-01-20", 1, categoryId, true));

        mvc.perform(apiDelete("/api/categories/" + categoryId)).andExpect(status().isNoContent());

        mvc.perform(apiGet("/api/subscriptions/" + id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.category").value(nullValue()));
    }

    @Test
    void requiresASession() throws Exception {
        mvc.perform(get("/api/subscriptions")).andExpect(status().isUnauthorized());
    }
}
