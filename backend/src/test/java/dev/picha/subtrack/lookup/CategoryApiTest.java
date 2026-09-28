package dev.picha.subtrack.lookup;

import static dev.picha.subtrack.ApiRequests.apiDelete;
import static dev.picha.subtrack.ApiRequests.apiGet;
import static dev.picha.subtrack.ApiRequests.apiPost;
import static dev.picha.subtrack.ApiRequests.apiPut;
import static dev.picha.subtrack.ApiRequests.idOf;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.picha.subtrack.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
class CategoryApiTest {

    @Autowired
    MockMvc mvc;

    private long create(String name) throws Exception {
        return idOf(mvc.perform(apiPost("/api/categories", "{\"name\": \"%s\"}".formatted(name)))
            .andExpect(status().isCreated())
            .andReturn());
    }

    @Test
    void createsAndListsSortedByName() throws Exception {
        create("Streaming");
        create("Gaming");

        mvc.perform(apiGet("/api/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].name", contains("Gaming", "Streaming")));
    }

    @Test
    void trimsNamesAndRejectsDuplicates() throws Exception {
        create("Streaming");

        mvc.perform(apiPost("/api/categories", "{\"name\": \"  Streaming \"}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.status").value(409))
            .andExpect(jsonPath("$.errors[0].field").value("name"))
            .andExpect(jsonPath("$.errors[0].code").value("duplicate"));

        mvc.perform(apiPost("/api/categories", "{\"name\": \"  Music \"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Music"));
    }

    @Test
    void validatesTheName() throws Exception {
        mvc.perform(apiPost("/api/categories", "{\"name\": \"  \"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.title").value("Validation failed"))
            .andExpect(jsonPath("$.errors[?(@.field == 'name')].code", contains("notBlank")));

        mvc.perform(apiPost("/api/categories", "{\"name\": \"%s\"}".formatted("x".repeat(51))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[?(@.field == 'name')].code", contains("size")));
    }

    @Test
    void renames() throws Exception {
        long id = create("Streming");

        mvc.perform(apiPut("/api/categories/" + id, "{\"name\": \"Streaming\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id))
            .andExpect(jsonPath("$.name").value("Streaming"));

        // renaming to its own current name is not a duplicate
        mvc.perform(apiPut("/api/categories/" + id, "{\"name\": \"Streaming\"}"))
            .andExpect(status().isOk());
    }

    @Test
    void renamingToAnotherCategorysNameIsAConflict() throws Exception {
        create("Gaming");
        long id = create("Streaming");

        mvc.perform(apiPut("/api/categories/" + id, "{\"name\": \"Gaming\"}"))
            .andExpect(status().isConflict());
    }

    @Test
    void deletes() throws Exception {
        long id = create("Streaming");

        mvc.perform(apiDelete("/api/categories/" + id)).andExpect(status().isNoContent());
        mvc.perform(apiGet("/api/categories")).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void unknownIdIsNotFound() throws Exception {
        mvc.perform(apiDelete("/api/categories/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404));
        mvc.perform(apiPut("/api/categories/999", "{\"name\": \"X\"}")).andExpect(status().isNotFound());
    }

    @Test
    void malformedJsonIsABadRequest() throws Exception {
        mvc.perform(apiPost("/api/categories", "{\"name\": "))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.title").value("Malformed request"));
    }

    @Test
    void requiresASession() throws Exception {
        mvc.perform(get("/api/categories")).andExpect(status().isUnauthorized());
    }
}
