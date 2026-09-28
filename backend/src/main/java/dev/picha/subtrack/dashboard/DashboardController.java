package dev.picha.subtrack.dashboard;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class DashboardController {

    private final DashboardService service;

    DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/api/dashboard")
    DashboardResponse dashboard() {
        return service.dashboard();
    }
}
