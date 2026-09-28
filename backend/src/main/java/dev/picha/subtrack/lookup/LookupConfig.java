package dev.picha.subtrack.lookup;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class LookupConfig {

    @Bean
    LookupService<Category> categoryService(CategoryRepository repository) {
        return new LookupService<>(repository, Category::new);
    }

    @Bean
    LookupService<PaymentMethod> paymentMethodService(PaymentMethodRepository repository) {
        return new LookupService<>(repository, PaymentMethod::new);
    }
}
