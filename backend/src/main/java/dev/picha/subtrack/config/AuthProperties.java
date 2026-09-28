package dev.picha.subtrack.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** The single account, from SUBTRACK_USERNAME and SUBTRACK_PASSWORD_HASH (BCrypt). */
@Validated
@ConfigurationProperties("subtrack.auth")
public record AuthProperties(@NotBlank String username, @NotBlank String passwordHash) {
}
