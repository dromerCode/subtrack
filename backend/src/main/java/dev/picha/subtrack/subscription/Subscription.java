package dev.picha.subtrack.subscription;

import dev.picha.subtrack.billing.IntervalUnit;
import dev.picha.subtrack.lookup.Category;
import dev.picha.subtrack.lookup.PaymentMethod;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "subscription")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    /** Total price of one charge, before splitting between {@link #sharedWith} people. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "interval_count", nullable = false)
    private int intervalCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "interval_unit", nullable = false, length = 5)
    private IntervalUnit intervalUnit;

    /** A known charge date; every other charge is computed from it. */
    @Column(name = "anchor_date", nullable = false)
    private LocalDate anchorDate;

    @Column(name = "shared_with", nullable = false)
    private int sharedWith;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "payment_method_id")
    private PaymentMethod paymentMethod;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void update(String name, BigDecimal price, int intervalCount, IntervalUnit intervalUnit,
            LocalDate anchorDate, int sharedWith, Category category, PaymentMethod paymentMethod,
            String notes, boolean active) {
        this.name = name;
        this.price = price;
        this.intervalCount = intervalCount;
        this.intervalUnit = intervalUnit;
        this.anchorDate = anchorDate;
        this.sharedWith = sharedWith;
        this.category = category;
        this.paymentMethod = paymentMethod;
        this.notes = notes;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public int getIntervalCount() {
        return intervalCount;
    }

    public IntervalUnit getIntervalUnit() {
        return intervalUnit;
    }

    public LocalDate getAnchorDate() {
        return anchorDate;
    }

    public int getSharedWith() {
        return sharedWith;
    }

    public Category getCategory() {
        return category;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public String getNotes() {
        return notes;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
