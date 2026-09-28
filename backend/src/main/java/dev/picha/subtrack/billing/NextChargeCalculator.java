package dev.picha.subtrack.billing;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Charge dates are always {@code anchor + k × interval} (k ≥ 0), computed from the anchor rather than
 * chained, so month-end dates do not drift: an anchor on the 31st gives Feb 28 and then Mar 31 again.
 */
public final class NextChargeCalculator {

    private NextChargeCalculator() {
    }

    public static LocalDate nextCharge(LocalDate anchor, int intervalCount, IntervalUnit unit, LocalDate today) {
        return chargeAt(anchor, intervalCount, unit, firstIndexOnOrAfter(anchor, intervalCount, unit, today));
    }

    public static List<LocalDate> chargesBetween(LocalDate anchor, int intervalCount, IntervalUnit unit,
            LocalDate from, LocalDate to) {
        List<LocalDate> charges = new ArrayList<>();
        for (long k = firstIndexOnOrAfter(anchor, intervalCount, unit, from); ; k++) {
            LocalDate charge = chargeAt(anchor, intervalCount, unit, k);
            if (charge.isAfter(to)) {
                return charges;
            }
            charges.add(charge);
        }
    }

    private static long firstIndexOnOrAfter(LocalDate anchor, int intervalCount, IntervalUnit unit, LocalDate day) {
        if (!anchor.isBefore(day)) {
            return 0;
        }
        // Whole units elapsed never overshoot, so start there and step forward.
        long k = unit.chronoUnit().between(anchor, day) / intervalCount;
        while (chargeAt(anchor, intervalCount, unit, k).isBefore(day)) {
            k++;
        }
        return k;
    }

    private static LocalDate chargeAt(LocalDate anchor, int intervalCount, IntervalUnit unit, long k) {
        return anchor.plus(k * intervalCount, unit.chronoUnit());
    }
}
