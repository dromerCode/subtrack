package dev.picha.subtrack.error;

/** A request points to a category or payment method that does not exist. */
public class InvalidReferenceException extends RuntimeException {

    private final String field;

    public InvalidReferenceException(String field) {
        this.field = field;
    }

    public String field() {
        return field;
    }
}
