package dev.picha.subtrack.config;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

/** @Validated makes these rules run at startup: a bad hash stops the app instead of failing every login. */
class AuthPropertiesTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsABcryptHash() {
        assertThat(validator.validate(new AuthProperties("admin",
            "$2y$10$oTWpOU3r8LDea6SCtHghcuXs642CtcLQQ7i4eFPzQfgAM5mC0jwdy"))).isEmpty();
    }

    @Test
    void rejectsAPlainPasswordOrAMangledHash() {
        assertThat(validator.validate(new AuthProperties("admin", "secret"))).isNotEmpty();
        // what's left of the hash after an unquoted .env interpolates "$2y", "$10", …
        assertThat(validator.validate(new AuthProperties("admin", "oTWpOU3r8LDea6SCtHghcuXs642CtcLQQ7i4eFPzQfgAM5mC0jwdy")))
            .isNotEmpty();
    }
}
