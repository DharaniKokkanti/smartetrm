package com.etrm.system.common;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditingConfig {

    /**
     * Until real auth lands (permissions are explicitly deferred — see the
     * Master Data Entry Technical Design doc, Section 6), every row is
     * attributed to the authenticated principal's username if one exists,
     * or "SYSTEM" otherwise. This keeps created_by/updated_by always
     * populated (the schema requires NOT NULL) without hardcoding "SYSTEM"
     * everywhere once auth does land — only this one bean needs to change.
     */
    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return Optional.of("SYSTEM");
            }
            return Optional.of(auth.getName());
        };
    }
}
