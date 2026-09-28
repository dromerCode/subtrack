package dev.picha.subtrack.lookup;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LookupRequest(@NotBlank @Size(max = 50) String name) {
}
