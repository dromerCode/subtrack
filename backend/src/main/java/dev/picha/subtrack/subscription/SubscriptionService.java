package dev.picha.subtrack.subscription;

import dev.picha.subtrack.error.NotFoundException;
import dev.picha.subtrack.lookup.Category;
import dev.picha.subtrack.lookup.LookupService;
import dev.picha.subtrack.lookup.PaymentMethod;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SubscriptionService {

    /** Active first, then by name. */
    private static final Sort LIST_ORDER = Sort.by(Sort.Order.desc("active"), Sort.Order.asc("name"));

    private final SubscriptionRepository subscriptions;
    private final LookupService<Category> categories;
    private final LookupService<PaymentMethod> paymentMethods;
    private final Clock clock;

    SubscriptionService(SubscriptionRepository subscriptions, LookupService<Category> categories,
            LookupService<PaymentMethod> paymentMethods, Clock clock) {
        this.subscriptions = subscriptions;
        this.categories = categories;
        this.paymentMethods = paymentMethods;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> list() {
        LocalDate today = LocalDate.now(clock);
        return subscriptions.findAll(LIST_ORDER).stream().map(s -> SubscriptionResponse.from(s, today)).toList();
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse get(Long id) {
        return SubscriptionResponse.from(find(id), LocalDate.now(clock));
    }

    public SubscriptionResponse create(SubscriptionRequest request) {
        Subscription subscription = new Subscription();
        apply(subscription, request);
        return SubscriptionResponse.from(subscriptions.saveAndFlush(subscription), LocalDate.now(clock));
    }

    public SubscriptionResponse update(Long id, SubscriptionRequest request) {
        Subscription subscription = find(id);
        apply(subscription, request);
        return SubscriptionResponse.from(subscriptions.saveAndFlush(subscription), LocalDate.now(clock));
    }

    public void delete(Long id) {
        subscriptions.delete(find(id));
    }

    private Subscription find(Long id) {
        return subscriptions.findById(id).orElseThrow(NotFoundException::new);
    }

    private void apply(Subscription subscription, SubscriptionRequest request) {
        Category category = request.categoryId() == null
            ? null : categories.getReference(request.categoryId(), "categoryId");
        PaymentMethod paymentMethod = request.paymentMethodId() == null
            ? null : paymentMethods.getReference(request.paymentMethodId(), "paymentMethodId");
        String notes = request.notes() == null || request.notes().isBlank() ? null : request.notes();
        subscription.update(request.name().trim(), request.price(), request.intervalCount(), request.intervalUnit(),
            request.anchorDate(), request.sharedWith(), category, paymentMethod, notes, request.active());
    }
}
