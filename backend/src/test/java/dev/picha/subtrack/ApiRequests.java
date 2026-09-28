package dev.picha.subtrack;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import com.jayway.jsonpath.JsonPath;
import java.io.UnsupportedEncodingException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Authenticated API requests (with CSRF) for MockMvc tests. */
public final class ApiRequests {

    private ApiRequests() {
    }

    public static MockHttpServletRequestBuilder apiGet(String url) {
        return get(url).with(user("test"));
    }

    public static MockHttpServletRequestBuilder apiPost(String url, String json) {
        return post(url).with(user("test")).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json);
    }

    public static MockHttpServletRequestBuilder apiPut(String url, String json) {
        return put(url).with(user("test")).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json);
    }

    public static MockHttpServletRequestBuilder apiDelete(String url) {
        return delete(url).with(user("test")).with(csrf());
    }

    public static long idOf(MvcResult result) throws UnsupportedEncodingException {
        return ((Number) JsonPath.read(result.getResponse().getContentAsString(), "$.id")).longValue();
    }

    /** Body for POST/PUT /api/subscriptions; {@code categoryId} may be null. */
    public static String subscriptionJson(String name, String price, int intervalCount, String intervalUnit,
            String anchorDate, int sharedWith, Long categoryId, boolean active) {
        return """
            {"name": "%s", "price": %s, "intervalCount": %d, "intervalUnit": "%s", "anchorDate": "%s",
             "sharedWith": %d, "categoryId": %s, "paymentMethodId": null, "notes": null, "active": %s}
            """.formatted(name, price, intervalCount, intervalUnit, anchorDate, sharedWith, categoryId, active);
    }
}
