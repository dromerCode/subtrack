package dev.picha.subtrack.lookup;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "category")
public class Category extends NamedEntity {

    protected Category() {
    }

    public Category(String name) {
        super(name);
    }
}
