package dev.picha.subtrack.subscription;

import static dev.picha.subtrack.billing.CostCalculator.monthlyFromYearly;
import static dev.picha.subtrack.billing.CostCalculator.round;

import dev.picha.subtrack.billing.CostCalculator;
import dev.picha.subtrack.billing.IntervalUnit;
import dev.picha.subtrack.billing.NextChargeCalculator;
import dev.picha.subtrack.lookup.LookupResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record SubscriptionResponse(
        Long id,
        String name,
        BigDecimal price,
        int intervalCount,
        IntervalUnit intervalUnit,
        LocalDate anchorDate,
        int sharedWith,
        LookupResponse category,
        LookupResponse paymentMethod,
        String notes,
        boolean active,
        Instant createdAt,
        Instant updatedAt,
        BigDecimal yourShare,
        BigDecimal monthlyCost,
        BigDecimal yearlyCost,
        LocalDate nextChargeDate) {

    static SubscriptionResponse from(Subscription s, LocalDate today) {
        BigDecimal yearly = CostCalculator.yearly(s.getPrice(), s.getSharedWith(), s.getIntervalCount(),
            s.getIntervalUnit());
        LocalDate nextCharge = s.isActive()
            ? NextChargeCalculator.nextCharge(s.getAnchorDate(), s.getIntervalCount(), s.getIntervalUnit(), today)
            : null;
        return new SubscriptionResponse(s.getId(), s.getName(), s.getPrice(), s.getIntervalCount(),
            s.getIntervalUnit(), s.getAnchorDate(), s.getSharedWith(), LookupResponse.from(s.getCategory()),
            LookupResponse.from(s.getPaymentMethod()), s.getNotes(), s.isActive(), s.getCreatedAt(),
            s.getUpdatedAt(), round(CostCalculator.yourShare(s.getPrice(), s.getSharedWith())),
            round(monthlyFromYearly(yearly)), round(yearly), nextCharge);
    }
}
