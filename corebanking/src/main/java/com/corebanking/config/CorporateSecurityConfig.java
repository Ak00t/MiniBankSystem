package com.corebanking.config;

import com.corebanking.security.CusCorporateJwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@RequiredArgsConstructor
public class CorporateSecurityConfig {

    private final CusCorporateJwtAuthenticationFilter
            cusCorporateJwtAuthenticationFilter;

    private final CorsConfigurationSource
            corsConfigurationSource;

    @Bean
    public FilterRegistrationBean<CusCorporateJwtAuthenticationFilter>
            cusCorporateJwtFilterRegistration(
                    CusCorporateJwtAuthenticationFilter filter) {
        FilterRegistrationBean<CusCorporateJwtAuthenticationFilter> registration =
                new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    @Order(0)
    public SecurityFilterChain corporateSecurityFilterChain(
            HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/corporate/**")
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/corporate/auth/login",
                                "/api/corporate/auth/verify-otp",
                                "/api/corporate/auth/resend-otp",
                                "/api/corporate/auth/first-login/change-password",
                                "/api/corporate/auth/first-login/setup-pin",
                                "/api/corporate/auth/first-login/complete",
                                "/api/corporate/auth/refresh"
                        ).permitAll()
                        .anyRequest().hasRole("CORPORATE_USER")
                )
                .addFilterBefore(
                        cusCorporateJwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );
        return http.build();
    }
}
