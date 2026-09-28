package dev.picha.subtrack.lookup;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payment-methods")
class PaymentMethodController extends LookupController<PaymentMethod> {

    PaymentMethodController(LookupService<PaymentMethod> service) {
        super(service);
    }
}
