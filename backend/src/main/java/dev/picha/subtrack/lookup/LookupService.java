package dev.picha.subtrack.lookup;

import dev.picha.subtrack.error.DuplicateNameException;
import dev.picha.subtrack.error.InvalidReferenceException;
import dev.picha.subtrack.error.NotFoundException;
import java.util.List;
import java.util.function.Function;
import org.springframework.transaction.annotation.Transactional;

/** CRUD for a user-editable list (categories or payment methods). Names are trimmed and unique. */
@Transactional
public class LookupService<T extends NamedEntity> {

    private final NamedEntityRepository<T> repository;
    private final Function<String, T> factory;

    public LookupService(NamedEntityRepository<T> repository, Function<String, T> factory) {
        this.repository = repository;
        this.factory = factory;
    }

    @Transactional(readOnly = true)
    public List<LookupResponse> list() {
        return repository.findAllByOrderByNameAsc().stream().map(LookupResponse::from).toList();
    }

    public LookupResponse create(String rawName) {
        String name = rawName.trim();
        if (repository.existsByName(name)) {
            throw new DuplicateNameException();
        }
        return LookupResponse.from(repository.save(factory.apply(name)));
    }

    public LookupResponse rename(Long id, String rawName) {
        T entity = find(id);
        String name = rawName.trim();
        if (repository.existsByNameAndIdNot(name, id)) {
            throw new DuplicateNameException();
        }
        entity.setName(name);
        return LookupResponse.from(entity);
    }

    public void delete(Long id) {
        repository.delete(find(id));
    }

    /** For subscription requests: a missing id is a validation error on {@code field}, not a 404. */
    @Transactional(readOnly = true)
    public T getReference(Long id, String field) {
        return repository.findById(id).orElseThrow(() -> new InvalidReferenceException(field));
    }

    private T find(Long id) {
        return repository.findById(id).orElseThrow(NotFoundException::new);
    }
}
