package com.one.security.config;

import com.one.security.service.impl.CustomUserDetailsService;
import com.one.security.service.impl.GitHubOAuth2LoginSuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final GitHubOAuth2LoginSuccessHandler gitHubOAuth2LoginSuccessHandler;
    private final OAuth2LoginProperties oauth2LoginProperties;
    private final PasswordEncoder passwordEncoder;
    private final SecurityContextRepository securityContextRepository;

    public SecurityConfig(CustomUserDetailsService userDetailsService,
                          GitHubOAuth2LoginSuccessHandler gitHubOAuth2LoginSuccessHandler,
                          OAuth2LoginProperties oauth2LoginProperties,
                          PasswordEncoder passwordEncoder,
                          SecurityContextRepository securityContextRepository) {
        this.userDetailsService = userDetailsService;
        this.gitHubOAuth2LoginSuccessHandler = gitHubOAuth2LoginSuccessHandler;
        this.oauth2LoginProperties = oauth2LoginProperties;
        this.passwordEncoder = passwordEncoder;
        this.securityContextRepository = securityContextRepository;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        AuthenticationManager authManager = authConfig.getAuthenticationManager();
        return authManager;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .authenticationProvider(authenticationProvider())
            .securityContext(securityContext -> securityContext
                .securityContextRepository(securityContextRepository))
            .csrf(csrf -> csrf.disable())
            .oauth2Login(oauth2 -> oauth2
                .successHandler(gitHubOAuth2LoginSuccessHandler)
                .failureHandler((request, response, exception) ->
                    response.sendRedirect(oauth2LoginProperties.getFailureRedirectUri())))
            .authorizeHttpRequests(authorize -> authorize
                .anyRequest().permitAll());
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "http://[::1]:*"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
