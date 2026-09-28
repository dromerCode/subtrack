package dev.picha.subtrack.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Lets React Router handle a reload, a deep link or a mistyped URL: any path of up to three segments
 * without a file extension serves the SPA's index.html. /api is excluded so unknown API routes stay 404,
 * and paths with a dot are left to the static resource handler.
 */
@Controller
class SpaForwardController {

    @GetMapping({ "/", "/{a:(?!api$)[^.]*}", "/{a:(?!api$)[^.]*}/{b:[^.]*}", "/{a:(?!api$)[^.]*}/{b:[^.]*}/{c:[^.]*}" })
    String forward() {
        return "forward:/index.html";
    }
}
