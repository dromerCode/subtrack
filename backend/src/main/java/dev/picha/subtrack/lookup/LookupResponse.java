package dev.picha.subtrack.lookup;

public record LookupResponse(Long id, String name) {

    public static LookupResponse from(NamedEntity entity) {
        return entity == null ? null : new LookupResponse(entity.getId(), entity.getName());
    }
}
