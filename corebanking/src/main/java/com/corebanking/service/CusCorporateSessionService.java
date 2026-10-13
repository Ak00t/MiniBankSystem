package com.corebanking.service;

import com.corebanking.entity.AuthSession;
import com.corebanking.entity.enums.SessionSubjectType;
import com.corebanking.entity.enums.UpdatedByType;
import com.corebanking.exception.CusAuthenticationException;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CusCorporateSessionService {

    private final CusSessionService cusSessionService;

    public AuthSession validateAccessSession(Claims claims) {
        return cusSessionService.validateCorporateAccessSession(claims);
    }

    public AuthSession validateRefreshSession(Claims claims, String rawRefreshToken) {
        return cusSessionService.validateCorporateRefreshSession(claims, rawRefreshToken);
    }

    public AuthSession validateAccessSessionForLogout(Claims claims) {
        return cusSessionService.validateCorporateAccessSessionForLogout(claims);
    }

    public String hashRefreshToken(String refreshToken) {
        return cusSessionService.hashRefreshToken(refreshToken);
    }

    public boolean revokeSession(AuthSession session, String reason) {
        if (session == null || session.getSubjectType() != SessionSubjectType.CORPORATE_USER
                || session.getCorporateUser() == null
                || session.getCorporateUser().getCorporateUserId() == null) {
            throw new CusAuthenticationException("Corporate session is invalid.");
        }
        return cusSessionService.revokeSession(
                session,
                reason,
                UpdatedByType.CORPORATE_USER,
                session.getCorporateUser().getCorporateUserId()
        );
    }
}
