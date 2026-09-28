package dev.picha.subtrack.dashboard;

import static dev.picha.subtrack.billing.CostCalculator.monthlyFromYearly;
import static dev.picha.subtrack.billing.CostCalculator.round;

import dev.picha.subtrack.billing.CostCalculator;
import dev.picha.subtrack.billing.NextChargeCalculator;
import dev.picha.subtrack.dashboard.DashboardResponse.CategorySpend;
import dev.picha.subtrack.dashboard.DashboardResponse.UpcomingCharge;
import dev.picha.subtrack.lookup.Category;
import dev.picha.subtrack.subscription.Subscription;
import dev.picha.subtrack.subscription.SubscriptionRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    static final int UPCOMING_DAYS = 30;

    private final SubscriptionRepository subscriptions;
    private final Clock clock;

    DashboardService(SubscriptionRepository subscriptions, Clock clock) {
        this.subscriptions = subscriptions;
        this.clock = clock;
    }

    public DashboardResponse dashboard() {
        LocalDate today = LocalDate.now(clock);
        LocalDate until = today.plusDays(UPCOMING_DAYS);

        BigDecimal yearlyTotal = BigDecimal.ZERO;
        // HashMap allows the null key used for "no category"
        Map<Long, BigDecimal> yearlyByCategory = new HashMap<>();
        Map<Long, String> categoryNames = new HashMap<>();
        List<UpcomingCharge> upcoming = new ArrayList<>();

        for (Subscription s : subscriptions.findByActiveTrue()) {
            BigDecimal yearly = CostCalculator.yearly(s.getPrice(), s.getSharedWith(), s.getIntervalCount(),
                s.getIntervalUnit());
            yearlyTotal = yearlyTotal.add(yearly);

            Category category = s.getCategory();
            Long categoryId = category == null ? null : category.getId();
            yearlyByCategory.merge(categoryId, yearly, BigDecimal::add);
            categoryNames.put(categoryId, category == null ? null : category.getName());

            BigDecimal share = round(CostCalculator.yourShare(s.getPrice(), s.getSharedWith()));
            for (LocalDate date : NextChargeCalculator.chargesBetween(s.getAnchorDate(), s.getIntervalCount(),
                    s.getIntervalUnit(), today, until)) {
                upcoming.add(new UpcomingCharge(s.getId(), s.getName(), date, share));
            }
        }

        upcoming.sort(Comparator.comparing(UpcomingCharge::date).thenComparing(UpcomingCharge::name));
        List<CategorySpend> byCategory = yearlyByCategory.entrySet().stream()
            .sorted(Map.Entry.<Long, BigDecimal>comparingByValue().reversed())
            .map(e -> new CategorySpend(e.getKey(), categoryNames.get(e.getKey()),
                round(monthlyFromYearly(e.getValue()))))
            .toList();

        return new DashboardResponse(round(monthlyFromYearly(yearlyTotal)), round(yearlyTotal), upcoming,
            byCategory);
    }
}
