package com.corebanking.config;

import com.corebanking.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration

@EnableMethodSecurity // (၁) Controller က @PreAuthorize တွေ အလုပ်လုပ်စေရန်
@RequiredArgsConstructor // (၂) JwtAuthFilter ကို Inject လုပ်နိုင်ရန်
public class SecurityConfig {

    // (၃) မင်းရေးထားတဲ့ JwtAuthFilter ကို လှမ်းခေါ်ပါ
    private final JwtAuthFilter jwtAuthFilter;


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll() // Login endpoint ကို ခွင့်ပြုခြင်း
                .requestMatchers("/api/customers/**").authenticated() // Customer APIs များသည် Token မဖြစ်မနေ လိုအပ်သည်
                .requestMatchers("/api/accounts/**").authenticated() // Add this line
                .anyRequest().authenticated()
            )

            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}