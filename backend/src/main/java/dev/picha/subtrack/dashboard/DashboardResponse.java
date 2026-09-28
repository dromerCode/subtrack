package dev.picha.subtrack.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DashboardResponse(
        BigDecimal monthlyTotal,
        BigDecimal yearlyTotal,
        List<UpcomingCharge> upcoming,
        List<CategorySpend> byCategory) {

    public record UpcomingCharge(Long id, String name, LocalDate date, BigDecimal yourShare) {
    }

    /** {@code categoryId} and {@code name} are null for subscriptions without a category. */
    public record CategorySpend(Long categoryId, String name, BigDecimal monthly) {
    }
}
