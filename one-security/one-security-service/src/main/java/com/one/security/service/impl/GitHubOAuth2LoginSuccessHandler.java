package com.one.security.service.impl;

import com.one.security.config.OAuth2LoginProperties;
import com.one.security.model.User;
import com.one.security.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@AllArgsConstructor
public class GitHubOAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    public static final String GITHUB_OAUTH2_ACTION = "github_oauth2_action";
    public static final String ACTION_BIND = "bind";
    public static final String ACTION_BIND_AFTER_LOGIN = "bind_after_login";
    public static final String GITHUB_OAUTH2_LOCAL_USER_ID = "github_oauth2_local_user_id";
    public static final String GITHUB_OAUTH2_LOCAL_USERNAME = "github_oauth2_local_username";
    public static final String GITHUB_OAUTH2_PENDING_PROFILE = "github_oauth2_pending_profile";

    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;
    private final CustomUserDetailsService userDetailsService;
    private final SecurityContextRepository securityContextRepository;
    private final OAuth2LoginProperties properties;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        if (!(authentication instanceof OAuth2AuthenticationToken oauth2Authentication)) {
            delegate().onAuthenticationSuccess(request, response, authentication);
            return;
        }

        HttpSession session = request.getSession(false);
        if (isBindingRequest(session)) {
            handleGitHubBinding(request, response, oauth2Authentication.getPrincipal(), session);
            return;
        }

        OAuth2User githubUser = oauth2Authentication.getPrincipal();
        Document binding = findGitHubBinding(githubUser.getAttributes());
        if (binding == null) {
            HttpSession pendingSession = request.getSession(true);
            pendingSession.setAttribute(GITHUB_OAUTH2_ACTION, ACTION_BIND_AFTER_LOGIN);
            pendingSession.setAttribute(GITHUB_OAUTH2_PENDING_PROFILE, new HashMap<>(githubUser.getAttributes()));
            log.info("GitHub OAuth2 user is not bound, redirecting to local login");
            response.sendRedirect(properties.getBindLoginRedirectUri());
            return;
        }

        String localUsername = binding.getString("localUsername");
        User user = resolveBoundUser(binding, localUsername);
        if (user == null) {
            request.getSession(true).setAttribute(GITHUB_OAUTH2_ACTION, ACTION_BIND_AFTER_LOGIN);
            request.getSession(true).setAttribute(GITHUB_OAUTH2_PENDING_PROFILE, new HashMap<>(githubUser.getAttributes()));
            response.sendRedirect(properties.getBindLoginRedirectUri());
            return;
        }

        saveLocalAuthentication(user.getUsername(), request, response);

        log.info("GitHub OAuth2 login successful: {}", user.getUsername());
        response.sendRedirect(properties.getSuccessRedirectUri());
    }

    private void handleGitHubBinding(HttpServletRequest request,
                                     HttpServletResponse response,
                                     OAuth2User oauth2User,
                                     HttpSession session) throws IOException {
        String localUserId = (String) session.getAttribute(GITHUB_OAUTH2_LOCAL_USER_ID);
        String localUsername = (String) session.getAttribute(GITHUB_OAUTH2_LOCAL_USERNAME);
        clearBindingSession(session);

        if (isBlank(localUsername)) {
            response.sendRedirect(properties.getBindFailureRedirectUri());
            return;
        }

        User localUser = userRepository.findByUsername(localUsername).orElse(null);
        if (localUser == null) {
            response.sendRedirect(properties.getBindFailureRedirectUri());
            return;
        }

        upsertGitHubBinding(oauth2User.getAttributes(), localUserId, localUsername);
        saveLocalAuthentication(localUsername, request, response);
        log.info("GitHub OAuth2 binding successful: {}", localUsername);
        response.sendRedirect(properties.getBindSuccessRedirectUri());
    }

    public boolean bindPendingGitHubUser(User localUser, HttpSession session) {
        if (!hasPendingLoginBinding(session) || localUser == null) {
            return false;
        }
        Object profile = session.getAttribute(GITHUB_OAUTH2_PENDING_PROFILE);
        clearBindingSession(session);
        if (!(profile instanceof Map<?, ?> rawProfile)) {
            return false;
        }

        Map<String, Object> attributes = new HashMap<>();
        rawProfile.forEach((key, value) -> {
            if (key != null) {
                attributes.put(String.valueOf(key), value);
            }
        });
        upsertGitHubBinding(attributes, localUser.getId(), localUser.getUsername());
        return true;
    }

    private void upsertGitHubBinding(Map<String, Object> attributes, String localUserId, String localUsername) {
        String githubId = valueAsString(attributes, "id");
        if (isBlank(githubId)) {
            throw new IllegalArgumentException("GitHub 用户信息缺少 id");
        }

        LocalDateTime now = LocalDateTime.now();
        Query query = Query.query(Criteria.where("provider").is("GitHub").and("thirdPartyUserId").is(githubId));
        Update update = new Update()
                .set("provider", "GitHub")
                .set("thirdPartyUserId", githubId)
                .set("localUserId", localUserId)
                .set("localUsername", localUsername)
                .set("username", valueAsString(attributes, "login"))
                .set("nickname", valueAsString(attributes, "name"))
                .set("avatarUrl", valueAsString(attributes, "avatar_url"))
                .set("email", valueAsString(attributes, "email"))
                .set("accountKey", "GitHub:" + (isBlank(localUserId) ? localUsername : localUserId))
                .set("rawProfile", attributes)
                .set("updatedAt", now)
                .setOnInsert("createdAt", now);
        mongoTemplate.upsert(query, update, "third_party_user_bindings");
    }

    private void saveLocalAuthentication(String username, HttpServletRequest request, HttpServletResponse response) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        Authentication localAuthentication = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );

        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(localAuthentication);
        SecurityContextHolder.setContext(securityContext);
        request.getSession(true);
        securityContextRepository.saveContext(securityContext, request, response);
    }

    private Document findGitHubBinding(Map<String, Object> attributes) {
        String githubId = valueAsString(attributes, "id");
        if (isBlank(githubId)) {
            return null;
        }
        Query query = Query.query(Criteria.where("provider").is("GitHub").and("thirdPartyUserId").is(githubId));
        return mongoTemplate.findOne(query, Document.class, "third_party_user_bindings");
    }

    private User resolveBoundUser(Document binding, String localUsername) {
        String localUserId = binding.getString("localUserId");
        if (!isBlank(localUserId)) {
            User byId = userRepository.findById(localUserId).orElse(null);
            if (byId != null) return byId;
        }
        if (!isBlank(localUsername)) {
            return userRepository.findByUsername(localUsername).orElse(null);
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private boolean isBindingRequest(HttpSession session) {
        return session != null && ACTION_BIND.equals(session.getAttribute(GITHUB_OAUTH2_ACTION));
    }

    private boolean hasPendingLoginBinding(HttpSession session) {
        return session != null && ACTION_BIND_AFTER_LOGIN.equals(session.getAttribute(GITHUB_OAUTH2_ACTION));
    }

    private void clearBindingSession(HttpSession session) {
        session.removeAttribute(GITHUB_OAUTH2_ACTION);
        session.removeAttribute(GITHUB_OAUTH2_LOCAL_USER_ID);
        session.removeAttribute(GITHUB_OAUTH2_LOCAL_USERNAME);
        session.removeAttribute(GITHUB_OAUTH2_PENDING_PROFILE);
    }

    private String valueAsString(Map<String, Object> data, String key) {
        if (data == null) return null;
        Object value = data.get(key);
        if (value == null) return null;
        if (value instanceof String text) return text;
        return String.valueOf(value);
    }

    private SavedRequestAwareAuthenticationSuccessHandler delegate() {
        SavedRequestAwareAuthenticationSuccessHandler handler = new SavedRequestAwareAuthenticationSuccessHandler();
        handler.setDefaultTargetUrl(properties.getSuccessRedirectUri());
        return handler;
    }
}
