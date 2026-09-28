package dev.picha.subtrack.subscription;

import dev.picha.subtrack.billing.IntervalUnit;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SubscriptionRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull @Positive @Digits(integer = 8, fraction = 2) BigDecimal price,
        // upper bound keeps anchor + k × interval inside LocalDate's range
        @NotNull @Min(1) @Max(1000) Integer intervalCount,
        @NotNull IntervalUnit intervalUnit,
        @NotNull LocalDate anchorDate,
        @NotNull @Min(1) Integer sharedWith,
        Long categoryId,
        Long paymentMethodId,
        @Size(max = 1000) String notes,
        @NotNull Boolean active) {
}
