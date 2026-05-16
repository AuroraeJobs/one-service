package org.aurorae.sso.controller;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.sso.dto.*;
import org.aurorae.sso.model.User;
import org.aurorae.sso.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public AuthController(AuthenticationManager authenticationManager, 
                         PasswordEncoder passwordEncoder, 
                         UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<Response<UserInfo>> login(@Validated @RequestBody LoginRequest request) {
        log.info("Login request: {}", request.getUsername());
        
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getRole()
            );
            
            log.info("Login successful: {}", request.getUsername());
            return ResponseEntity.ok(Response.success("登录成功", userInfo));
            
        } catch (BadCredentialsException e) {
            log.error("Login failed: Bad credentials for user: {}", request.getUsername());
            return ResponseEntity.status(401).body(Response.error(401, "用户名或密码错误"));
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
            user.setRole("USER");
            user.setEnabled(true);
            user.setDeleted(false);
            user.setCreateTime(LocalDateTime.now());
            user.setUpdateTime(LocalDateTime.now());
            
            userRepository.save(user);
            
            log.info("User registered successfully: {}", request.getUsername());
            return ResponseEntity.ok(Response.success("注册成功"));
            
        } catch (Exception e) {
            log.error("Registration error: {}", e);
            return ResponseEntity.status(500).body(Response.error(500, "注册失败: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Response<UserInfo>> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
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
            user.getRole()
        );
        
        return ResponseEntity.ok(Response.success(userInfo));
    }

    @PostMapping("/logout")
    public ResponseEntity<Response<String>> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Response.success("退出成功"));
    }
}
