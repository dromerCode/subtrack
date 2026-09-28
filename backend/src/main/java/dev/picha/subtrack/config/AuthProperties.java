package dev.picha.subtrack.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** The single account, from SUBTRACK_USERNAME and SUBTRACK_PASSWORD_HASH (BCrypt). */
@Validated
@ConfigurationProperties("subtrack.auth")
public record AuthProperties(
        @NotBlank String username,
        // a BCrypt hash; anything else (e.g. mangled by .env interpolation of "$") would reject every login
        @NotBlank @Pattern(regexp = "^\\$2[aby]?\\$\\d{2}\\$[./A-Za-z0-9]{53}$") String passwordHash) {
}
