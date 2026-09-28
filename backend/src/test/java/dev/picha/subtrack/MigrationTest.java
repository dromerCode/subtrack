package dev.picha.subtrack;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/** Checks the SQL schema itself, on its own database, so seed data is not wiped by other tests. */
@Testcontainers
class MigrationTest {

    @Container
    static PostgreSQLContainer postgres = new PostgreSQLContainer(DockerImageName.parse("postgres:18-alpine"));

    static JdbcTemplate jdbc;

    @BeforeAll
    static void migrate() {
        Flyway.configure()
            .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
            .load()
            .migrate();
        jdbc = new JdbcTemplate(
            new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()));
    }

    @Test
    void seedsExampleCategoriesAndNoPaymentMethods() {
        assertThat(jdbc.queryForList("SELECT name FROM category ORDER BY id", String.class))
            .containsExactly("Streaming", "Música", "Software", "Gaming", "Otros");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM payment_method", Integer.class)).isZero();
    }

    @Test
    void rejectsNonPositivePriceAndZeroCounts() {
        assertThatThrownBy(() -> insertSubscription("0.00", 1, 1, null))
            .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> insertSubscription("5.00", 0, 1, null))
            .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> insertSubscription("5.00", 1, 0, null))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void deletingACategoryLeavesSubscriptionsWithoutCategory() {
        Long categoryId = jdbc.queryForObject(
            "INSERT INTO category (name) VALUES ('Temporary') RETURNING id", Long.class);
        Long subscriptionId = insertSubscription("9.99", 1, 1, categoryId);

        jdbc.update("DELETE FROM category WHERE id = ?", categoryId);

        assertThat(jdbc.queryForObject(
            "SELECT category_id FROM subscription WHERE id = ?", Long.class, subscriptionId)).isNull();
    }

    private Long insertSubscription(String price, int intervalCount, int sharedWith, Long categoryId) {
        return jdbc.queryForObject("""
            INSERT INTO subscription (name, price, interval_count, interval_unit, anchor_date, shared_with, category_id)
            VALUES ('Test', ?::numeric, ?, 'MONTH', DATE '2026-01-01', ?, ?)
            RETURNING id""", Long.class, price, intervalCount, sharedWith, categoryId);
    }
}
