package dev.picha.subtrack.auth;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class AuthController {

    record MeResponse(String username) {
    }

    @GetMapping("/api/auth/me")
    MeResponse me(Authentication authentication) {
        return new MeResponse(authentication.getName());
    }
}
