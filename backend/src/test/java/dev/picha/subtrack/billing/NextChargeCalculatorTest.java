package dev.picha.subtrack.billing;

import static dev.picha.subtrack.billing.IntervalUnit.DAY;
import static dev.picha.subtrack.billing.IntervalUnit.MONTH;
import static dev.picha.subtrack.billing.IntervalUnit.WEEK;
import static dev.picha.subtrack.billing.IntervalUnit.YEAR;
import static dev.picha.subtrack.billing.NextChargeCalculator.chargesBetween;
import static dev.picha.subtrack.billing.NextChargeCalculator.nextCharge;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class NextChargeCalculatorTest {

    private static LocalDate d(String iso) {
        return LocalDate.parse(iso);
    }

    @Test
    void futureAnchorIsTheNextCharge() {
        assertThat(nextCharge(d("2026-04-01"), 1, MONTH, d("2026-03-10"))).isEqualTo(d("2026-04-01"));
    }

    @Test
    void anchorTodayIsChargedToday() {
        assertThat(nextCharge(d("2026-03-10"), 1, MONTH, d("2026-03-10"))).isEqualTo(d("2026-03-10"));
    }

    @Test
    void monthlyFromPastAnchor() {
        assertThat(nextCharge(d("2025-11-05"), 1, MONTH, d("2026-03-10"))).isEqualTo(d("2026-04-05"));
        assertThat(nextCharge(d("2025-11-05"), 1, MONTH, d("2026-03-05"))).isEqualTo(d("2026-03-05"));
    }

    @Test
    void everyTenDays() {
        assertThat(nextCharge(d("2026-03-01"), 10, DAY, d("2026-03-12"))).isEqualTo(d("2026-03-21"));
    }

    @Test
    void everyTwoWeeks() {
        assertThat(nextCharge(d("2026-01-05"), 2, WEEK, d("2026-01-20"))).isEqualTo(d("2026-02-02"));
    }

    @Test
    void everyThreeMonths() {
        assertThat(nextCharge(d("2025-01-15"), 3, MONTH, d("2026-03-10"))).isEqualTo(d("2026-04-15"));
    }

    @Test
    void yearly() {
        assertThat(nextCharge(d("2020-06-30"), 1, YEAR, d("2026-07-01"))).isEqualTo(d("2027-06-30"));
    }

    @Test
    void endOfMonthDoesNotDrift() {
        LocalDate anchor = d("2026-01-31");
        assertThat(nextCharge(anchor, 1, MONTH, d("2026-02-01"))).isEqualTo(d("2026-02-28"));
        assertThat(nextCharge(anchor, 1, MONTH, d("2026-03-01"))).isEqualTo(d("2026-03-31"));
    }

    @Test
    void leapDayYearly() {
        LocalDate anchor = d("2024-02-29");
        assertThat(nextCharge(anchor, 1, YEAR, d("2026-01-01"))).isEqualTo(d("2026-02-28"));
        assertThat(nextCharge(anchor, 1, YEAR, d("2027-03-01"))).isEqualTo(d("2028-02-29"));
    }

    @Test
    void chargesBetweenListsEveryChargeInTheWindow() {
        assertThat(chargesBetween(d("2026-01-10"), 2, WEEK, d("2026-01-15"), d("2026-02-14")))
            .containsExactly(d("2026-01-24"), d("2026-02-07"));
    }

    @Test
    void chargesBetweenIncludesBothEnds() {
        assertThat(chargesBetween(d("2026-01-15"), 1, MONTH, d("2026-01-15"), d("2026-02-15")))
            .containsExactly(d("2026-01-15"), d("2026-02-15"));
    }

    @Test
    void chargesBetweenCanBeEmpty() {
        assertThat(chargesBetween(d("2026-01-01"), 1, YEAR, d("2026-01-15"), d("2026-02-14"))).isEmpty();
    }
}
