package com.etrm.system.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Real, per-endpoint authorization — wired 2026-07-20 against the
 * role_function/app_function/user_role_assignment tables built for the RBAC
 * admin UI. This was previously deferred (see git history / handoff doc
 * V0-era note) pending that table existing; it now does, so every endpoint
 * below requires a real PERM_<function_code> authority
 * (JwtAuthenticationFilter + UserPermissionService attach a user's actual
 * grants per request) rather than just "any valid JWT."
 *
 * Rule shape per module bucket: GET requires the module's "_VIEW" function
 * granted at any access level (PERM_<CODE>_VIEW); a mutating verb requires
 * the specific create/edit/delete-type function granted at READ_WRITE
 * (PERM_<CODE>_WRITE) — mirrors the RBAC data model's own granularity
 * (Compliance, e.g., holds MD_CREATE at READ only — visible, not actionable).
 * More specific path patterns (e.g. approve/reject sub-actions) are ordered
 * before their broader parent pattern, since authorizeHttpRequests uses
 * first-match-wins. Anything not explicitly bucketed below falls through to
 * `.anyRequest().authenticated()` — same permissive-but-authenticated
 * behavior as before for genuinely new/unmapped endpoints, not a silent
 * expansion of access.
 *
 * No controller/type-level @PreAuthorize is used — a single centralized
 * rule set here is far easier to audit and keep in sync with the registry
 * than ~100 scattered annotations, and matches this module's own db-query-
 * driven verification method (an endpoint's real path is the source of
 * truth, not a per-controller convention someone might forget).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${etrm.cors.allowed-origins}")
    private String allowedOrigins;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()) // stateless JWT API, no cookie-based session to protect
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()

                // ── Static Data (generic Tier2 CRUD grid — SD_*) ───────────
                .requestMatchers(HttpMethod.GET, "/api/v1/reference-data/**").hasAuthority("PERM_SD_VIEW")
                .requestMatchers(HttpMethod.POST, "/api/v1/reference-data/**").hasAuthority("PERM_SD_CREATE_WRITE")
                .requestMatchers(HttpMethod.PUT, "/api/v1/reference-data/**").hasAuthority("PERM_SD_EDIT_WRITE")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/reference-data/**").hasAuthority("PERM_SD_DELETE_WRITE")

                // ── Counterparty Management (core entity + nested sub-resources) ──
                .requestMatchers(HttpMethod.GET, "/api/v1/counterparties/**").hasAuthority("PERM_CP_VIEW")
                .requestMatchers(HttpMethod.POST, "/api/v1/counterparties/**").hasAuthority("PERM_CP_CREATE_WRITE")
                .requestMatchers(HttpMethod.PUT, "/api/v1/counterparties/**").hasAuthority("PERM_CP_EDIT_WRITE")
                .requestMatchers(HttpMethod.PATCH, "/api/v1/counterparties/**").hasAuthority("PERM_CP_EDIT_WRITE")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/counterparties/**").hasAuthority("PERM_CP_DEACTIVATE_WRITE")

                // ── Position & P&L (read-only today — no write endpoints exist) ──
                .requestMatchers(HttpMethod.GET, "/api/v1/positions/**", "/api/v1/pricing/tas-positions/**").hasAuthority("PERM_POS_VIEW")

                // ── Pricing & Curves (only VIEW/EDIT codes exist — one write tier) ──
                .requestMatchers(HttpMethod.GET, "/api/v1/pricing-rules/**", "/api/v1/price-indices/**",
                        "/api/v1/price-sources/**", "/api/v1/settlement-prices/**", "/api/v1/pricing/formula-templates/**")
                    .hasAuthority("PERM_PRICE_VIEW")
                .requestMatchers("/api/v1/pricing-rules/**", "/api/v1/price-indices/**",
                        "/api/v1/price-sources/**", "/api/v1/settlement-prices/**", "/api/v1/pricing/formula-templates/**")
                    .hasAuthority("PERM_PRICE_EDIT_WRITE")

                // ── Administration — Users ─────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/v1/admin/users/**").hasAuthority("PERM_USER_VIEW")
                .requestMatchers(HttpMethod.POST, "/api/v1/admin/users/**").hasAuthority("PERM_USER_CREATE_WRITE")
                .requestMatchers("/api/v1/admin/users/**").hasAuthority("PERM_USER_EDIT_WRITE")

                // ── Administration — RBAC (roles/assignments/permissions) ──
                // Approve/reject/submit sub-actions first — more specific than
                // the plain roles/**、role-assignments/** patterns below.
                .requestMatchers(HttpMethod.PATCH, "/api/v1/roles/*/submit", "/api/v1/roles/*/approve",
                        "/api/v1/roles/*/reject", "/api/v1/role-assignments/*/approve",
                        "/api/v1/role-assignments/*/reject", "/api/v1/book-access-grants/*/approve",
                        "/api/v1/book-access-grants/*/reject")
                    .hasAuthority("PERM_ROLE_APPROVE_WRITE")
                .requestMatchers(HttpMethod.GET, "/api/v1/roles/**", "/api/v1/role-assignments/**",
                        "/api/v1/app-modules", "/api/v1/app-functions", "/api/v1/permissions/**",
                        "/api/v1/users/**", "/api/v1/book-access-grants/**")
                    .hasAuthority("PERM_ROLE_VIEW")
                .requestMatchers(HttpMethod.POST, "/api/v1/roles").hasAuthority("PERM_ROLE_CREATE_WRITE")
                .requestMatchers(HttpMethod.PUT, "/api/v1/roles/**").hasAuthority("PERM_ROLE_EDIT_WRITE")
                .requestMatchers("/api/v1/permissions/**").hasAuthority("PERM_ROLE_EDIT_WRITE")
                // Remaining writes under /api/v1/users/** are role-assignment/
                // book-access-grant create+remove — "assign roles to users".
                .requestMatchers("/api/v1/users/**", "/api/v1/book-access-grants/**").hasAuthority("PERM_ROLE_ASSIGN_WRITE")

                // ── Everything else registered/dedicated master data ───────
                // (legal entities, books, currencies, countries, locations,
                // vessels, products, logistics, credit/risk agreements,
                // voyage-ops, environmental/RIN, polymorphic address/contact/
                // bank-account/tax-registration sub-resources, etc.)
                .requestMatchers(HttpMethod.GET,
                        "/api/v1/legal-entities/**", "/api/v1/books/**", "/api/v1/book-classification-dimensions/**",
                        "/api/v1/currencies/**", "/api/v1/countries/**", "/api/v1/locations/**",
                        "/api/v1/vessels/**", "/api/v1/products/**", "/api/v1/storage/**",
                        "/api/v1/pipelines/**", "/api/v1/spec-templates/**", "/api/v1/spec-parameters/**",
                        "/api/v1/logistics/**", "/api/v1/exchanges/**", "/api/v1/markets/**",
                        "/api/v1/holiday-calendars/**", "/api/v1/incoterms-ref/**", "/api/v1/payment-terms/**",
                        "/api/v1/payment-methods/**", "/api/v1/uom/**", "/api/v1/uom-conversions/**",
                        "/api/v1/gl-accounts/**", "/api/v1/periods/**", "/api/v1/traders/**",
                        "/api/v1/credit/**", "/api/v1/brokers/**", "/api/v1/broker-fee-agreements/**",
                        "/api/v1/parent-company-guarantees/**", "/api/v1/carbon-registries/**",
                        "/api/v1/emission-schemes/**", "/api/v1/emission-obligations/**",
                        "/api/v1/environmental-products/**", "/api/v1/rin-accounts/**", "/api/v1/rin-fuel-categories/**",
                        "/api/v1/rin-inventory/**", "/api/v1/rin-obligations/**", "/api/v1/rin-transactions/**",
                        "/api/v1/compliance/**", "/api/v1/entity-tax-registrations/**", "/api/v1/bank-accounts/**",
                        "/api/v1/addresses/**", "/api/v1/entity-addresses/**", "/api/v1/contacts/**",
                        "/api/v1/entity-contacts/**", "/api/v1/voyage-ops/**", "/api/v1/commodity-instrument-map/**",
                        "/api/v1/operations/**", "/api/v1/freight/**", "/api/v1/gtcs/**")
                    .hasAuthority("PERM_MD_VIEW")
                .requestMatchers(HttpMethod.POST,
                        "/api/v1/legal-entities/**", "/api/v1/books/**", "/api/v1/book-classification-dimensions/**",
                        "/api/v1/currencies/**", "/api/v1/countries/**", "/api/v1/locations/**",
                        "/api/v1/vessels/**", "/api/v1/products/**", "/api/v1/storage/**",
                        "/api/v1/pipelines/**", "/api/v1/spec-templates/**", "/api/v1/spec-parameters/**",
                        "/api/v1/logistics/**", "/api/v1/exchanges/**", "/api/v1/markets/**",
                        "/api/v1/holiday-calendars/**", "/api/v1/incoterms-ref/**", "/api/v1/payment-terms/**",
                        "/api/v1/payment-methods/**", "/api/v1/uom/**", "/api/v1/uom-conversions/**",
                        "/api/v1/gl-accounts/**", "/api/v1/periods/**", "/api/v1/traders/**",
                        "/api/v1/credit/**", "/api/v1/brokers/**", "/api/v1/broker-fee-agreements/**",
                        "/api/v1/parent-company-guarantees/**", "/api/v1/carbon-registries/**",
                        "/api/v1/emission-schemes/**", "/api/v1/emission-obligations/**",
                        "/api/v1/environmental-products/**", "/api/v1/rin-accounts/**", "/api/v1/rin-fuel-categories/**",
                        "/api/v1/rin-inventory/**", "/api/v1/rin-obligations/**", "/api/v1/rin-transactions/**",
                        "/api/v1/compliance/**", "/api/v1/entity-tax-registrations/**", "/api/v1/bank-accounts/**",
                        "/api/v1/addresses/**", "/api/v1/entity-addresses/**", "/api/v1/contacts/**",
                        "/api/v1/entity-contacts/**", "/api/v1/voyage-ops/**", "/api/v1/commodity-instrument-map/**",
                        "/api/v1/operations/**", "/api/v1/freight/**", "/api/v1/gtcs/**")
                    .hasAuthority("PERM_MD_CREATE_WRITE")
                .requestMatchers(HttpMethod.PUT,
                        "/api/v1/legal-entities/**", "/api/v1/books/**", "/api/v1/book-classification-dimensions/**",
                        "/api/v1/currencies/**", "/api/v1/countries/**", "/api/v1/locations/**",
                        "/api/v1/vessels/**", "/api/v1/products/**", "/api/v1/storage/**",
                        "/api/v1/pipelines/**", "/api/v1/spec-templates/**", "/api/v1/spec-parameters/**",
                        "/api/v1/logistics/**", "/api/v1/exchanges/**", "/api/v1/markets/**",
                        "/api/v1/holiday-calendars/**", "/api/v1/incoterms-ref/**", "/api/v1/payment-terms/**",
                        "/api/v1/payment-methods/**", "/api/v1/uom/**", "/api/v1/uom-conversions/**",
                        "/api/v1/gl-accounts/**", "/api/v1/periods/**", "/api/v1/traders/**",
                        "/api/v1/credit/**", "/api/v1/brokers/**", "/api/v1/broker-fee-agreements/**",
                        "/api/v1/parent-company-guarantees/**", "/api/v1/carbon-registries/**",
                        "/api/v1/emission-schemes/**", "/api/v1/emission-obligations/**",
                        "/api/v1/environmental-products/**", "/api/v1/rin-accounts/**", "/api/v1/rin-fuel-categories/**",
                        "/api/v1/rin-inventory/**", "/api/v1/rin-obligations/**", "/api/v1/rin-transactions/**",
                        "/api/v1/compliance/**", "/api/v1/entity-tax-registrations/**", "/api/v1/bank-accounts/**",
                        "/api/v1/addresses/**", "/api/v1/entity-addresses/**", "/api/v1/contacts/**",
                        "/api/v1/entity-contacts/**", "/api/v1/voyage-ops/**", "/api/v1/commodity-instrument-map/**",
                        "/api/v1/operations/**", "/api/v1/freight/**", "/api/v1/gtcs/**")
                    .hasAuthority("PERM_MD_EDIT_WRITE")
                .requestMatchers(HttpMethod.PATCH,
                        "/api/v1/legal-entities/**", "/api/v1/books/**", "/api/v1/book-classification-dimensions/**",
                        "/api/v1/currencies/**", "/api/v1/countries/**", "/api/v1/locations/**",
                        "/api/v1/vessels/**", "/api/v1/products/**", "/api/v1/storage/**",
                        "/api/v1/pipelines/**", "/api/v1/spec-templates/**", "/api/v1/spec-parameters/**",
                        "/api/v1/logistics/**", "/api/v1/exchanges/**", "/api/v1/markets/**",
                        "/api/v1/holiday-calendars/**", "/api/v1/incoterms-ref/**", "/api/v1/payment-terms/**",
                        "/api/v1/payment-methods/**", "/api/v1/uom/**", "/api/v1/uom-conversions/**",
                        "/api/v1/gl-accounts/**", "/api/v1/periods/**", "/api/v1/traders/**",
                        "/api/v1/credit/**", "/api/v1/brokers/**", "/api/v1/broker-fee-agreements/**",
                        "/api/v1/parent-company-guarantees/**", "/api/v1/carbon-registries/**",
                        "/api/v1/emission-schemes/**", "/api/v1/emission-obligations/**",
                        "/api/v1/environmental-products/**", "/api/v1/rin-accounts/**", "/api/v1/rin-fuel-categories/**",
                        "/api/v1/rin-inventory/**", "/api/v1/rin-obligations/**", "/api/v1/rin-transactions/**",
                        "/api/v1/compliance/**", "/api/v1/entity-tax-registrations/**", "/api/v1/bank-accounts/**",
                        "/api/v1/addresses/**", "/api/v1/entity-addresses/**", "/api/v1/contacts/**",
                        "/api/v1/entity-contacts/**", "/api/v1/voyage-ops/**", "/api/v1/commodity-instrument-map/**",
                        "/api/v1/operations/**", "/api/v1/freight/**", "/api/v1/gtcs/**")
                    .hasAuthority("PERM_MD_EDIT_WRITE")
                .requestMatchers(HttpMethod.DELETE,
                        "/api/v1/legal-entities/**", "/api/v1/books/**", "/api/v1/book-classification-dimensions/**",
                        "/api/v1/currencies/**", "/api/v1/countries/**", "/api/v1/locations/**",
                        "/api/v1/vessels/**", "/api/v1/products/**", "/api/v1/storage/**",
                        "/api/v1/pipelines/**", "/api/v1/spec-templates/**", "/api/v1/spec-parameters/**",
                        "/api/v1/logistics/**", "/api/v1/exchanges/**", "/api/v1/markets/**",
                        "/api/v1/holiday-calendars/**", "/api/v1/incoterms-ref/**", "/api/v1/payment-terms/**",
                        "/api/v1/payment-methods/**", "/api/v1/uom/**", "/api/v1/uom-conversions/**",
                        "/api/v1/gl-accounts/**", "/api/v1/periods/**", "/api/v1/traders/**",
                        "/api/v1/credit/**", "/api/v1/brokers/**", "/api/v1/broker-fee-agreements/**",
                        "/api/v1/parent-company-guarantees/**", "/api/v1/carbon-registries/**",
                        "/api/v1/emission-schemes/**", "/api/v1/emission-obligations/**",
                        "/api/v1/environmental-products/**", "/api/v1/rin-accounts/**", "/api/v1/rin-fuel-categories/**",
                        "/api/v1/rin-inventory/**", "/api/v1/rin-obligations/**", "/api/v1/rin-transactions/**",
                        "/api/v1/compliance/**", "/api/v1/entity-tax-registrations/**", "/api/v1/bank-accounts/**",
                        "/api/v1/addresses/**", "/api/v1/entity-addresses/**", "/api/v1/contacts/**",
                        "/api/v1/entity-contacts/**", "/api/v1/voyage-ops/**", "/api/v1/commodity-instrument-map/**",
                        "/api/v1/operations/**", "/api/v1/freight/**", "/api/v1/gtcs/**")
                    .hasAuthority("PERM_MD_DELETE_WRITE")

                // Trade Management (TRADE_*) has no backend controller yet —
                // trade/trade_order/trade_item are frontend-mocks-only today
                // (see handoff doc). Nothing to gate; codes stay reserved.

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
