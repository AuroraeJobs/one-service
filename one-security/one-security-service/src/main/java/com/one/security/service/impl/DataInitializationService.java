package com.one.security.service.impl;

import lombok.extern.slf4j.Slf4j;
import com.one.security.model.User;
import com.one.security.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.time.LocalDateTime;

@Slf4j
@Service
public class DataInitializationService implements CommandLineRunner {

    @Resource
    private UserRepository userRepository;

    @Resource
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initializeDefaultUsers();
    }

    private void initializeDefaultUsers() {
        log.info("Starting user data initialization...");
        
        // 初始化管理员用户
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setEmail("admin@aurorae.com");
            admin.setPhone("13800138000");
            admin.setRole("ADMIN");
            admin.setEnabled(true);
            admin.setDeleted(false);
            admin.setCreateTime(LocalDateTime.now());
            admin.setUpdateTime(LocalDateTime.now());
            userRepository.save(admin);
            log.info("Created default admin user: admin");
        }
        
        // 初始化测试用户
        if (!userRepository.existsByUsername("testuser")) {
            User testUser = new User();
            testUser.setUsername("testuser");
            testUser.setPassword(passwordEncoder.encode("test123"));
            testUser.setEmail("test@aurorae.com");
            testUser.setPhone("13900139000");
            testUser.setRole("USER");
            testUser.setEnabled(true);
            testUser.setDeleted(false);
            testUser.setCreateTime(LocalDateTime.now());
            testUser.setUpdateTime(LocalDateTime.now());
            userRepository.save(testUser);
            log.info("Created default test user: testuser");
        }
        
        log.info("User data initialization completed!");
    }
}
