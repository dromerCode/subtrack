CREATE TABLE category (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE payment_method (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE subscription (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name              VARCHAR(100)   NOT NULL,
    price             NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    interval_count    INTEGER        NOT NULL CHECK (interval_count >= 1),
    interval_unit     VARCHAR(5)     NOT NULL CHECK (interval_unit IN ('DAY', 'WEEK', 'MONTH', 'YEAR')),
    anchor_date       DATE           NOT NULL,
    shared_with       INTEGER        NOT NULL DEFAULT 1 CHECK (shared_with >= 1),
    category_id       BIGINT REFERENCES category (id) ON DELETE SET NULL,
    payment_method_id BIGINT REFERENCES payment_method (id) ON DELETE SET NULL,
    notes             VARCHAR(1000),
    active            BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now()
);

INSERT INTO category (name) VALUES ('Streaming'), ('Música'), ('Software'), ('Gaming'), ('Otros');
