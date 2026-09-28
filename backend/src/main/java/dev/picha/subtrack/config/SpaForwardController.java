package dev.picha.subtrack.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Lets React Router handle a reload or a deep link: these paths all serve the SPA's index.html. */
@Controller
class SpaForwardController {

    @GetMapping({ "/", "/login", "/subscriptions", "/subscriptions/**", "/settings" })
    String forward() {
        return "forward:/index.html";
    }
}
