package com.one.security.service.impl;

import lombok.extern.slf4j.Slf4j;
import com.one.security.model.User;
import com.one.security.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import jakarta.annotation.Resource;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Resource
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrAccount) throws UsernameNotFoundException {
        String account = usernameOrAccount == null ? "" : usernameOrAccount.trim();
        log.info("Loading user by account: {}", account);

        User user = findByAccount(account)
                .orElseThrow(() -> {
                    log.error("User not found: {}", account);
                    return new UsernameNotFoundException("User not found: " + account);
                });

        log.info("User found: {}, enabled: {}", user.getUsername(), user.getEnabled());

        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        
        if (user.getRole() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase()));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.getEnabled(),
                true,
                true,
                true,
                authorities
        );
    }

    private Optional<User> findByAccount(String account) {
        if (account.isBlank()) {
            return Optional.empty();
        }

        Optional<User> user = userRepository.findByUsername(account);
        if (user.isPresent()) {
            return user;
        }

        user = userRepository.findByEmail(account);
        if (user.isPresent()) {
            return user;
        }

        return userRepository.findByPhone(account);
    }
}
