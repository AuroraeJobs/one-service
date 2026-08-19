package com.one.record.web;

import com.one.record.service.IStockUserContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Stock-module user resolver backed by the shared Spring Security context.
 * OAuth2 logins are converted to local username authentication by the
 * security module, so the authentication name is always the local username.
 */
@Slf4j
@Component
public class StockUserContext implements IStockUserContext {

    @Override
    public String currentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null
                    || !authentication.isAuthenticated()
                    || authentication instanceof AnonymousAuthenticationToken) {
                return DEFAULT_USER_ID;
            }
            String name = authentication.getName();
            if (name == null || name.isBlank()) {
                return DEFAULT_USER_ID;
            }
            return name.trim();
        } catch (RuntimeException ex) {
            log.warn("Failed to resolve stock user from security context, fallback to default", ex);
            return DEFAULT_USER_ID;
        }
    }
}
