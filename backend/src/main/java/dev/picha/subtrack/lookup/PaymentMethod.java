package dev.picha.subtrack.lookup;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "payment_method")
public class PaymentMethod extends NamedEntity {

    protected PaymentMethod() {
    }

    public PaymentMethod(String name) {
        super(name);
    }
}
