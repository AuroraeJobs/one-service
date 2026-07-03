package com.one.security.controller;

import com.one.security.dto.LoginRequest;
import com.one.security.dto.RegisterRequest;
import com.one.security.dto.Response;
import com.one.security.dto.UpdatePasswordRequest;
import com.one.security.dto.UpdateUserProfileRequest;
import com.one.security.dto.UserInfo;
import com.one.security.config.OAuth2LoginProperties;
import com.one.security.service.impl.CustomUserDetailsService;
import com.one.security.service.impl.GitHubOAuth2LoginSuccessHandler;
import lombok.extern.slf4j.Slf4j;
import com.one.security.model.User;
import com.one.security.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
}, allowCredentials = "true")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final SecurityContextRepository securityContextRepository;
    private final OAuth2LoginProperties oauth2LoginProperties;
    private final CustomUserDetailsService userDetailsService;
    private final GitHubOAuth2LoginSuccessHandler gitHubOAuth2LoginSuccessHandler;

    public AuthController(AuthenticationManager authenticationManager, 
                         PasswordEncoder passwordEncoder, 
                         UserRepository userRepository,
                         SecurityContextRepository securityContextRepository,
                         OAuth2LoginProperties oauth2LoginProperties,
                         CustomUserDetailsService userDetailsService,
                         GitHubOAuth2LoginSuccessHandler gitHubOAuth2LoginSuccessHandler) {
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.securityContextRepository = securityContextRepository;
        this.oauth2LoginProperties = oauth2LoginProperties;
        this.userDetailsService = userDetailsService;
        this.gitHubOAuth2LoginSuccessHandler = gitHubOAuth2LoginSuccessHandler;
    }

    @PostMapping("/login")
    public ResponseEntity<Response<UserInfo>> login(@Validated @RequestBody LoginRequest request,
                                                    HttpServletRequest httpRequest,
                                                    HttpServletResponse httpResponse) {
        String account = request.getUsername().trim();
        log.info("Login request: {}", account);
        
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(account, request.getPassword())
            );

            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(authentication);
            SecurityContextHolder.setContext(securityContext);
            httpRequest.getSession(true);
            securityContextRepository.saveContext(securityContext, httpRequest, httpResponse);
            
            User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getAvatar(),
                user.getRole()
            );

            boolean githubBound = gitHubOAuth2LoginSuccessHandler.bindPendingGitHubUser(user, httpRequest.getSession(false));
            
            log.info("Login successful: {}", user.getUsername());
            return ResponseEntity.ok(Response.success(githubBound ? "登录成功，GitHub 已绑定" : "登录成功", userInfo));
            
        } catch (BadCredentialsException e) {
            log.error("Login failed: Bad credentials for account: {}", account);
            return ResponseEntity.status(401).body(Response.error(401, "账号或密码错误"));
        } catch (Exception e) {
            log.error("Login error: {}", e);
            return ResponseEntity.status(500).body(Response.error(500, "登录失败: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Response<String>> register(@Validated @RequestBody RegisterRequest request) {
        log.info("Register request: {}", request.getUsername());
        
        try {
            if (userRepository.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest().body(Response.error(400, "用户名已存在"));
            }
            
            if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body(Response.error(400, "邮箱已存在"));
            }
            
            if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
                return ResponseEntity.badRequest().body(Response.error(400, "手机号已存在"));
            }
            
            User user = new User();
            user.setUsername(request.getUsername());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            user.setAvatar(request.getAvatar());
            user.setRole("USER");
            user.setEnabled(true);
            user.setDeleted(false);
            long now = System.currentTimeMillis();
            user.setCreateTime(now);
            user.setUpdateTime(now);
            
            userRepository.save(user);
            
            log.info("User registered successfully: {}", request.getUsername());
            return ResponseEntity.ok(Response.success("注册成功"));
            
        } catch (Exception e) {
            log.error("Registration error: {}", e);
            return ResponseEntity.status(500).body(Response.error(500, "注册失败: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Response<UserInfo>> getCurrentUser(HttpServletRequest request) {
        Authentication authentication = getCurrentAuthentication(request);
        
        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(401).body(Response.error(401, "未登录"));
        }
        
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        
        if (user == null) {
            return ResponseEntity.status(404).body(Response.error(404, "用户不存在"));
        }
        
        UserInfo userInfo = new UserInfo(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getPhone(),
            user.getAvatar(),
            user.getRole()
        );
        
        return ResponseEntity.ok(Response.success(userInfo));
    }

    @PutMapping("/me")
    public ResponseEntity<Response<UserInfo>> updateCurrentUser(@Validated @RequestBody UpdateUserProfileRequest request,
                                                               HttpServletRequest httpRequest,
                                                               HttpServletResponse httpResponse) {
        Authentication authentication = getCurrentAuthentication(httpRequest);

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(401).body(Response.error(401, "未登录"));
        }

        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Response.error(404, "用户不存在"));
        }

        String username = trimToNull(request.getUsername());
        String email = trimToNull(request.getEmail());
        String phone = trimToNull(request.getPhone());
        String avatar = trimToNull(request.getAvatar());

        if (username == null) {
            return ResponseEntity.badRequest().body(Response.error(400, "用户名不能为空"));
        }
        if (isTakenByAnotherUser(userRepository.findByUsername(username).orElse(null), user.getId())) {
            return ResponseEntity.badRequest().body(Response.error(400, "用户名已存在"));
        }
        if (email != null && isTakenByAnotherUser(userRepository.findByEmail(email).orElse(null), user.getId())) {
            return ResponseEntity.badRequest().body(Response.error(400, "邮箱已存在"));
        }
        if (phone != null && isTakenByAnotherUser(userRepository.findByPhone(phone).orElse(null), user.getId())) {
            return ResponseEntity.badRequest().body(Response.error(400, "手机号已存在"));
        }

        user.setUsername(username);
        user.setEmail(email);
        user.setPhone(phone);
        user.setAvatar(avatar);
        user.setUpdateTime(System.currentTimeMillis());
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        UsernamePasswordAuthenticationToken updatedAuthentication = new UsernamePasswordAuthenticationToken(
            userDetails,
            null,
            userDetails.getAuthorities()
        );
        updatedAuthentication.setDetails(authentication.getDetails());
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(updatedAuthentication);
        SecurityContextHolder.setContext(securityContext);
        securityContextRepository.saveContext(securityContext, httpRequest, httpResponse);

        UserInfo userInfo = new UserInfo(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getPhone(),
            user.getAvatar(),
            user.getRole()
        );

        return ResponseEntity.ok(Response.success("用户信息已更新", userInfo));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Response<String>> updateCurrentUserPassword(@Validated @RequestBody UpdatePasswordRequest request,
                                                                     HttpServletRequest httpRequest) {
        Authentication authentication = getCurrentAuthentication(httpRequest);

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(401).body(Response.error(401, "未登录"));
        }

        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Response.error(404, "用户不存在"));
        }

        if (user.getPassword() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(Response.error(400, "当前密码不正确"));
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(Response.error(400, "新密码不能与当前密码相同"));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdateTime(System.currentTimeMillis());
        userRepository.save(user);

        return ResponseEntity.ok(Response.success("密码已更新"));
    }

    @GetMapping("/oauth2/github/bind")
    public void bindGitHub(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Authentication authentication = getCurrentAuthentication(request);
        if (!isAuthenticated(authentication)) {
            response.sendRedirect(oauth2LoginProperties.getBindFailureRedirectUri());
            return;
        }

        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null) {
            response.sendRedirect(oauth2LoginProperties.getBindFailureRedirectUri());
            return;
        }

        HttpSession session = request.getSession(true);
        session.setAttribute(GitHubOAuth2LoginSuccessHandler.GITHUB_OAUTH2_ACTION, GitHubOAuth2LoginSuccessHandler.ACTION_BIND);
        session.setAttribute(GitHubOAuth2LoginSuccessHandler.GITHUB_OAUTH2_LOCAL_USER_ID, user.getId());
        session.setAttribute(GitHubOAuth2LoginSuccessHandler.GITHUB_OAUTH2_LOCAL_USERNAME, user.getUsername());
        response.sendRedirect("/oauth2/authorization/github");
    }

    @PostMapping("/logout")
    public ResponseEntity<Response<String>> logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok(Response.success("退出成功"));
    }

    private boolean isTakenByAnotherUser(User existingUser, String currentUserId) {
        return existingUser != null && !existingUser.getId().equals(currentUserId);
    }

    private Authentication getCurrentAuthentication(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (isAuthenticated(authentication)) {
            return authentication;
        }

        if (request != null) {
            SecurityContext repositoryContext = securityContextRepository.loadDeferredContext(request).get();
            if (repositoryContext != null && isAuthenticated(repositoryContext.getAuthentication())) {
                SecurityContextHolder.setContext(repositoryContext);
                return repositoryContext.getAuthentication();
            }
        }

        HttpSession session = request == null ? null : request.getSession(false);
        if (session == null) {
            return authentication;
        }

        Object context = session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
        if (context instanceof SecurityContext securityContext) {
            Authentication sessionAuthentication = securityContext.getAuthentication();
            if (isAuthenticated(sessionAuthentication)) {
                SecurityContextHolder.setContext(securityContext);
                return sessionAuthentication;
            }
        }

        return authentication;
    }

    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null
            && authentication.isAuthenticated()
            && !(authentication instanceof AnonymousAuthenticationToken);
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
