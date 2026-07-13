package com.etrm.system.support;

import com.etrm.system.common.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Base for every controller integration test. Runs against the REAL SQL
 * Server database (same one `mvn spring-boot:run` uses) — the app is
 * SQL-Server-specific throughout (temporal tables, sys.* catalog queries in
 * ReferenceDataMetadataService), so there's no H2/in-memory profile to fall
 * back to. Requires the same env vars as running the app normally:
 *
 *   cd etrm-backend && set -a && source .env && set +a && mvn test
 *
 * Auth: mints a JWT directly via JwtService rather than going through
 * POST /auth/login — JwtAuthenticationFilter only validates the token
 * signature/expiry and never looks the user up in the DB (see
 * SecurityConfig's note: every endpoint is "authenticated but
 * unrestricted"), so a self-signed token for a fixed test principal is
 * exactly as valid as a real login and doesn't depend on any seeded user's
 * password hash being real.
 *
 * Test data hygiene: every test that creates a row must clean it up (or
 * deactivate it, for tables where allow_delete/permanent-record semantics
 * apply) so repeated `mvn test` runs against the same live DB don't
 * accumulate junk or collide on unique constraints. Use {@link #unique()}
 * to generate collision-free codes/names per test run.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
public abstract class ApiTestBase {

    private static final AtomicLong COUNTER = new AtomicLong(System.currentTimeMillis() % 1_000_000);

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    protected String authHeaderValue;

    /** Must be a real, seeded app_user — FieldPermissionService.resolve()
     *  looks the principal up by username (to check role assignments) and
     *  404s outright for a token minted against a username that doesn't
     *  exist in app_user, unlike most endpoints which only check the token's
     *  signature/expiry. j.smith is one of the seeded Meridian Trading test
     *  users (see database/test-data/).*/
    private static final String TEST_USERNAME = "j.smith";

    @BeforeEach
    void mintTestToken() {
        authHeaderValue = "Bearer " + jwtService.generateToken(TEST_USERNAME, 1L);
    }

    protected MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder builder) {
        return builder.header("Authorization", authHeaderValue).contentType(MediaType.APPLICATION_JSON);
    }

    /** Collision-free suffix for codes/names — safe to run this suite
     *  repeatedly against the same live DB without unique-constraint clashes
     *  from a previous run's leftover (or intentionally-kept) rows. */
    protected static String unique() {
        return "T" + COUNTER.incrementAndGet();
    }

    protected String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
