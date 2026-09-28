package dev.picha.subtrack.billing;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

/** Spend of the current user (their share only). Results are unrounded; call {@link #round} when presenting. */
public final class CostCalculator {

    private static final MathContext PRECISION = MathContext.DECIMAL64;
    private static final BigDecimal MONTHS_PER_YEAR = BigDecimal.valueOf(12);

    private CostCalculator() {
    }

    public static BigDecimal yourShare(BigDecimal price, int sharedWith) {
        return price.divide(BigDecimal.valueOf(sharedWith), PRECISION);
    }

    public static BigDecimal yearly(BigDecimal price, int sharedWith, int intervalCount, IntervalUnit unit) {
        return yourShare(price, sharedWith)
            .multiply(BigDecimal.valueOf(unit.chargesPerYear()))
            .divide(BigDecimal.valueOf(intervalCount), PRECISION);
    }

    public static BigDecimal monthlyFromYearly(BigDecimal yearly) {
        return yearly.divide(MONTHS_PER_YEAR, PRECISION);
    }

    public static BigDecimal round(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }
}
