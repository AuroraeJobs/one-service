package com.one.security.controller;

import com.one.security.dto.AdminCreateUserRequest;
import com.one.security.dto.AdminResetUserCredentialsRequest;
import com.one.security.dto.AdminUpdateUserRequest;
import com.one.security.dto.AdminUserPageResponse;
import com.one.security.dto.AdminUserSummary;
import com.one.security.dto.Response;
import com.one.security.model.User;
import com.one.security.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/auth/admin/users")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
}, allowCredentials = "true")
public class AdminUserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityContextRepository securityContextRepository;

    public AdminUserController(UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               SecurityContextRepository securityContextRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityContextRepository = securityContextRepository;
    }

    @GetMapping
    public ResponseEntity<Response<AdminUserPageResponse>> listUsers(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            HttpServletRequest request) {
        User currentUser = getCurrentAdminUser(request);
        if (currentUser == null) {
            return forbiddenOrUnauthorized(request);
        }

        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageRequest = PageRequest.of(
            safePage - 1,
            safeSize,
            Sort.by(Sort.Direction.DESC, "createTime", "updateTime")
        );
        Page<User> users = userRepository.findAll(pageRequest);
        AdminUserPageResponse response = new AdminUserPageResponse(
            users.getContent().stream().map(this::toSummary).toList(),
            users.getTotalElements(),
            safePage,
            safeSize
        );
        return ResponseEntity.ok(Response.success(response));
    }

    @PostMapping
    public ResponseEntity<Response<AdminUserSummary>> createUser(@Valid @RequestBody AdminCreateUserRequest request,
                                                                 HttpServletRequest httpRequest) {
        User currentUser = getCurrentAdminUser(httpRequest);
        if (currentUser == null) {
            return forbiddenOrUnauthorized(httpRequest);
        }

        String username = trimToNull(request.getUsername());
        String email = trimToNull(request.getEmail());
        String phone = trimToNull(request.getPhone());
        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Response.error(400, "用户名已存在"));
        }
        if (email != null && userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Response.error(400, "邮箱已存在"));
        }
        if (phone != null && userRepository.existsByPhone(phone)) {
            return ResponseEntity.badRequest().body(Response.error(400, "手机号已存在"));
        }

        long now = System.currentTimeMillis();
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(email);
        user.setPhone(phone);
        user.setAvatar(trimToNull(request.getAvatar()));
        user.setRole(normalizeRole(request.getRole()));
        user.setEnabled(true);
        user.setDeleted(false);
        user.setCreateTime(now);
        user.setUpdateTime(now);
        User saved = userRepository.save(user);
        return ResponseEntity.ok(Response.success("用户已创建", toSummary(saved)));
    }

    @PatchMapping("/{id}/disable")
    public ResponseEntity<Response<AdminUserSummary>> disableUser(@PathVariable("id") String id,
                                                                  HttpServletRequest request) {
        User currentUser = getCurrentAdminUser(request);
        if (currentUser == null) {
            return forbiddenOrUnauthorized(request);
        }
        User target = userRepository.findById(id).orElse(null);
        if (target == null) {
            return ResponseEntity.status(404).body(Response.error(404, "用户不存在"));
        }
        if (target.getId().equals(currentUser.getId())) {
            return ResponseEntity.badRequest().body(Response.error(400, "不能禁用当前登录用户"));
        }
        target.setEnabled(false);
        target.setUpdateTime(System.currentTimeMillis());
        return ResponseEntity.ok(Response.success("用户已禁用", toSummary(userRepository.save(target))));
    }

    @PatchMapping("/{id}/enable")
    public ResponseEntity<Response<AdminUserSummary>> enableUser(@PathVariable("id") String id,
                                                                 HttpServletRequest request) {
        User currentUser = getCurrentAdminUser(request);
        if (currentUser == null) {
            return forbiddenOrUnauthorized(request);
        }
        User target = userRepository.findById(id).orElse(null);
        if (target == null) {
            return ResponseEntity.status(404).body(Response.error(404, "用户不存在"));
        }
        target.setEnabled(true);
        target.setUpdateTime(System.currentTimeMillis());
        return ResponseEntity.ok(Response.success("用户已启用", toSummary(userRepository.save(target))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Response<AdminUserSummary>> updateUser(@PathVariable("id") String id,
                                                                 @Valid @RequestBody AdminUpdateUserRequest request,
                                                                 HttpServletRequest httpRequest) {
        User currentUser = getCurrentAdminUser(httpRequest);
        if (currentUser == null) {
            return forbiddenOrUnauthorized(httpRequest);
        }
        User target = userRepository.findById(id).orElse(null);
        if (target == null) {
            return ResponseEntity.status(404).body(Response.error(404, "用户不存在"));
        }

        String username = trimToNull(request.getUsername());
        String email = trimToNull(request.getEmail());
        String phone = trimToNull(request.getPhone());
        String role = normalizeRole(request.getRole());
        boolean enabled = request.getEnabled() == null || request.getEnabled();

        if (username == null) {
            return ResponseEntity.badRequest().body(Response.error(400, "用户名不能为空"));
        }
        if (target.getId().equals(currentUser.getId()) && !target.getUsername().equals(username)) {
            return ResponseEntity.badRequest().body(Response.error(400, "不能在用户管理中修改当前登录用户的用户名"));
        }
        if (target.getId().equals(currentUser.getId()) && (!enabled || !"ADMIN".equals(role))) {
            return ResponseEntity.badRequest().body(Response.error(400, "不能禁用当前登录用户或移除当前管理员角色"));
        }
        User existingUsernameUser = userRepository.findByUsername(username).orElse(null);
        if (existingUsernameUser != null && !existingUsernameUser.getId().equals(target.getId())) {
            return ResponseEntity.badRequest().body(Response.error(400, "用户名已存在"));
        }
        User existingEmailUser = email == null ? null : userRepository.findByEmail(email).orElse(null);
        if (existingEmailUser != null && !existingEmailUser.getId().equals(target.getId())) {
            return ResponseEntity.badRequest().body(Response.error(400, "邮箱已存在"));
        }
        User existingPhoneUser = phone == null ? null : userRepository.findByPhone(phone).orElse(null);
        if (existingPhoneUser != null && !existingPhoneUser.getId().equals(target.getId())) {
            return ResponseEntity.badRequest().body(Response.error(400, "手机号已存在"));
        }

        target.setUsername(username);
        target.setEmail(email);
        target.setPhone(phone);
        target.setAvatar(trimToNull(request.getAvatar()));
        target.setRole(role);
        target.setEnabled(enabled);
        target.setUpdateTime(System.currentTimeMillis());
        return ResponseEntity.ok(Response.success("用户资料已更新", toSummary(userRepository.save(target))));
    }

    @PutMapping("/{id}/credentials")
    public ResponseEntity<Response<AdminUserSummary>> resetCredentials(
            @PathVariable("id") String id,
            @Valid @RequestBody AdminResetUserCredentialsRequest request,
            HttpServletRequest httpRequest) {
        User currentUser = getCurrentAdminUser(httpRequest);
        if (currentUser == null) {
            return forbiddenOrUnauthorized(httpRequest);
        }
        User target = userRepository.findById(id).orElse(null);
        if (target == null) {
            return ResponseEntity.status(404).body(Response.error(404, "用户不存在"));
        }

        target.setPassword(passwordEncoder.encode(request.getPassword()));
        target.setUpdateTime(System.currentTimeMillis());
        return ResponseEntity.ok(Response.success("密码已重置", toSummary(userRepository.save(target))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Response<String>> deleteDisabledUser(@PathVariable("id") String id,
                                                               HttpServletRequest request) {
        User currentUser = getCurrentAdminUser(request);
        if (currentUser == null) {
            return forbiddenOrUnauthorized(request);
        }
        User target = userRepository.findById(id).orElse(null);
        if (target == null) {
            return ResponseEntity.status(404).body(Response.error(404, "用户不存在"));
        }
        if (target.getId().equals(currentUser.getId())) {
            return ResponseEntity.badRequest().body(Response.error(400, "不能删除当前登录用户"));
        }
        if (Boolean.TRUE.equals(target.getEnabled())) {
            return ResponseEntity.badRequest().body(Response.error(400, "只能删除禁用状态的用户"));
        }
        userRepository.delete(target);
        return ResponseEntity.ok(Response.success("用户已删除", id));
    }

    private User getCurrentAdminUser(HttpServletRequest request) {
        Authentication authentication = getCurrentAuthentication(request);
        if (!isAuthenticated(authentication)) {
            return null;
        }
        User currentUser = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return null;
        }
        return currentUser;
    }

    private <T> ResponseEntity<Response<T>> forbiddenOrUnauthorized(HttpServletRequest request) {
        Authentication authentication = getCurrentAuthentication(request);
        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(401).body(Response.error(401, "未登录"));
        }
        return ResponseEntity.status(403).body(Response.error(403, "仅管理员可操作"));
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

    private AdminUserSummary toSummary(User user) {
        return new AdminUserSummary(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getPhone(),
            user.getAvatar(),
            user.getRole(),
            user.getEnabled(),
            user.getCreateTime(),
            user.getUpdateTime()
        );
    }

    private String normalizeRole(String role) {
        String normalized = trimToNull(role);
        if (normalized == null) return "USER";
        return "ADMIN".equalsIgnoreCase(normalized) ? "ADMIN" : "USER";
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
