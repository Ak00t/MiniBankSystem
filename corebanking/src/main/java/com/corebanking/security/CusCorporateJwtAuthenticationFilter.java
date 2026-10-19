package com.corebanking.security;

import com.corebanking.entity.AuthSession;
import com.corebanking.entity.CorporateUser;
import com.corebanking.entity.enums.CorporateRole;
import com.corebanking.entity.enums.SessionSubjectType;
import com.corebanking.exception.CusSessionExpiredException;
import com.corebanking.repository.CusJwtRevokedTokensRepository;
import com.corebanking.service.CusCorporateSessionService;
import com.corebanking.service.CusJwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class CusCorporateJwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Set<String> PUBLIC_POST_PATHS = Set.of(
            "/api/corporate/auth/login",
            "/api/corporate/auth/verify-otp",
            "/api/corporate/auth/resend-otp",
            "/api/corporate/auth/first-login/change-password",
            "/api/corporate/auth/first-login/setup-pin",
            "/api/corporate/auth/first-login/complete",
            "/api/corporate/auth/refresh"
    );

    private final CusJwtService cusJwtService;
    private final CusCorporateSessionService corporateSessionService;
    private final CusJwtRevokedTokensRepository cusJwtRevokedTokensRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI().substring(request.getContextPath().length());
        if (!uri.equals("/api/corporate") && !uri.startsWith("/api/corporate/")) {
            return true;
        }
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }
        return HttpMethod.POST.matches(request.getMethod()) && PUBLIC_POST_PATHS.contains(uri);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            unauthorized(response, "Authentication token is required.");
            return;
        }
        String token = authorizationHeader.substring(7).trim();
        if (token.isBlank()) {
            unauthorized(response, "Invalid authentication token.");
            return;
        }

        try {
            Claims claims = cusJwtService.getClaims(token);
            if (!"ACCESS".equals(claims.get("tokenType", String.class))
                    || !"CORPORATE_USER".equals(claims.get("subjectType", String.class))) {
                unauthorized(response, "Invalid authentication token.");
                return;
            }
            String jti = claims.getId();
            if (jti == null || jti.isBlank()) {
                unauthorized(response, "Invalid authentication token.");
                return;
            }
            if (cusJwtRevokedTokensRepository.existsByJti(jti)) {
                unauthorized(response, "Authentication token has been revoked.");
                return;
            }

            AuthSession session = corporateSessionService.validateAccessSession(claims);
            if (session == null || session.getSubjectType() != SessionSubjectType.CORPORATE_USER
                    || session.getCorporateUser() == null
                    || session.getCorporateUser().getCorporateUserId() == null) {
                unauthorized(response, "Invalid authentication token.");
                return;
            }
            CorporateUser user = session.getCorporateUser();
            CorporateRole role = user.getCorporateRole();
            if (role != CorporateRole.CEO && role != CorporateRole.MAKER) {
                unauthorized(response, "Invalid authentication token.");
                return;
            }
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            user.getCorporateUserId().toString(),
                            null,
                            List.of(
                                    new SimpleGrantedAuthority("ROLE_CORPORATE_USER"),
                                    new SimpleGrantedAuthority("ROLE_" + role.name())
                            )
                    );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (ExpiredJwtException ex) {
            unauthorized(response, "Access token has expired.");
            return;
        } catch (JwtException | IllegalArgumentException ex) {
            unauthorized(response, "Invalid authentication token.");
            return;
        } catch (CusSessionExpiredException ex) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(
                    "{\"success\":false,\"code\":\"SESSION_EXPIRED\","
                            + "\"message\":\"Authentication session has expired.\"}"
            );
            return;
        } catch (RuntimeException ex) {
            unauthorized(response, "Invalid authentication token.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        SecurityContextHolder.clearContext();
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\"}");
    }
}
