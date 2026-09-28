package dev.picha.subtrack.billing;

import java.time.temporal.ChronoUnit;

public enum IntervalUnit {
    DAY(ChronoUnit.DAYS, 365),
    WEEK(ChronoUnit.WEEKS, 52),
    MONTH(ChronoUnit.MONTHS, 12),
    YEAR(ChronoUnit.YEARS, 1);

    private final ChronoUnit chronoUnit;
    private final int chargesPerYear;

    IntervalUnit(ChronoUnit chronoUnit, int chargesPerYear) {
        this.chronoUnit = chronoUnit;
        this.chargesPerYear = chargesPerYear;
    }

    public ChronoUnit chronoUnit() {
        return chronoUnit;
    }

    /** How many charges a year an interval of 1 of this unit makes. */
    public int chargesPerYear() {
        return chargesPerYear;
    }
}
