package dev.picha.subtrack.lookup;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Shared endpoints; subclasses only choose the base path. */
public abstract class LookupController<T extends NamedEntity> {

    private final LookupService<T> service;

    protected LookupController(LookupService<T> service) {
        this.service = service;
    }

    @GetMapping
    public List<LookupResponse> list() {
        return service.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LookupResponse create(@Valid @RequestBody LookupRequest request) {
        return service.create(request.name());
    }

    @PutMapping("/{id}")
    public LookupResponse rename(@PathVariable Long id, @Valid @RequestBody LookupRequest request) {
        return service.rename(id, request.name());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
