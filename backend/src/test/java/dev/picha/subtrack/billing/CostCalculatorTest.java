package dev.picha.subtrack.billing;

import static dev.picha.subtrack.billing.CostCalculator.monthlyFromYearly;
import static dev.picha.subtrack.billing.CostCalculator.round;
import static dev.picha.subtrack.billing.CostCalculator.yearly;
import static dev.picha.subtrack.billing.CostCalculator.yourShare;
import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class CostCalculatorTest {

    private static BigDecimal eur(String amount) {
        return new BigDecimal(amount);
    }

    @Test
    void yourShareSplitsThePriceBetweenPeople() {
        assertThat(round(yourShare(eur("12.00"), 3))).isEqualByComparingTo("4.00");
        assertThat(round(yourShare(eur("10.00"), 3))).isEqualByComparingTo("3.33");
        assertThat(round(yourShare(eur("9.99"), 1))).isEqualByComparingTo("9.99");
    }

    @Test
    void yearlyUsesChargesPerYearOfEachUnit() {
        assertThat(round(yearly(eur("1.00"), 1, 1, IntervalUnit.DAY))).isEqualByComparingTo("365.00");
        assertThat(round(yearly(eur("2.00"), 1, 1, IntervalUnit.WEEK))).isEqualByComparingTo("104.00");
        assertThat(round(yearly(eur("9.99"), 1, 1, IntervalUnit.MONTH))).isEqualByComparingTo("119.88");
        assertThat(round(yearly(eur("100.00"), 1, 1, IntervalUnit.YEAR))).isEqualByComparingTo("100.00");
    }

    @Test
    void yearlyDividesByTheIntervalCount() {
        assertThat(round(yearly(eur("30.00"), 1, 3, IntervalUnit.MONTH))).isEqualByComparingTo("120.00");
        assertThat(round(yearly(eur("100.00"), 1, 2, IntervalUnit.YEAR))).isEqualByComparingTo("50.00");
    }

    @Test
    void yearlyCountsOnlyYourShare() {
        assertThat(round(yearly(eur("18.00"), 3, 1, IntervalUnit.MONTH))).isEqualByComparingTo("72.00");
    }

    @Test
    void roundsOnlyAtTheEnd() {
        // 10 / 3 = 3.333…; rounding first would give 3.33 × 12 = 39.96
        assertThat(round(yearly(eur("10.00"), 3, 1, IntervalUnit.MONTH))).isEqualByComparingTo("40.00");
    }

    @Test
    void monthlyIsYearlyOverTwelve() {
        assertThat(round(monthlyFromYearly(yearly(eur("100.00"), 1, 1, IntervalUnit.YEAR))))
            .isEqualByComparingTo("8.33");
    }

    @Test
    void roundUsesHalfUp() {
        assertThat(round(eur("1.005"))).isEqualByComparingTo("1.01");
        assertThat(round(eur("1.004"))).isEqualByComparingTo("1.00");
    }
}
