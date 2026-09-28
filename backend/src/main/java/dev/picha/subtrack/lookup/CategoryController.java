package dev.picha.subtrack.lookup;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
class CategoryController extends LookupController<Category> {

    CategoryController(LookupService<Category> service) {
        super(service);
    }
}
