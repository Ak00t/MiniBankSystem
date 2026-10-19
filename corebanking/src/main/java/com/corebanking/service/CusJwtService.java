package com.corebanking.service;

import java.security.Key;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


import com.corebanking.entity.CustomerCredentials;
import com.corebanking.entity.enums.SessionSubjectType;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class CusJwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.issuer}")
    private String jwtIssuer;

    @Value("${jwt.expiration}")
    private long accessTokenExpiration;


    public static final long SESSION_LIFETIME_HOURS = 24L;

    // Refresh Token = maximum 24 hours
    private static final long REFRESH_TOKEN_EXPIRATION =
            SESSION_LIFETIME_HOURS * 60 * 60 * 1000;


    // =========================================================
    // SIGNING KEY
    // =========================================================

    private Key getSigningKey() {

        byte[] keyBytes =
                Decoders.BASE64.decode(
                        jwtSecret
                );

        return Keys.hmacShaKeyFor(
                keyBytes
        );
    }


    // =========================================================
    // ACCESS TOKEN GENERATE
    // =========================================================

    public String generateAccessToken(
            UUID customerId,
            String sessionUuid,
            long tokenVersion) {

        Date now =
                new Date();

        Date expiry =
                new Date(
                        now.getTime()
                                + accessTokenExpiration
                );


        return Jwts.builder()

                // customer ဘယ်သူလဲ
                .setSubject(
                        customerId.toString()
                )

                // session ဘယ်ဟာလဲ
                .claim(
                        "sid",
                        sessionUuid
                )

                // CUSTOMER / STAFF
                .claim(
                        "subjectType",
                        "CUSTOMER"
                )

                // token version
                .claim(
                        "tokenVersion",
                        tokenVersion
                )

                // Access token ဆိုတာသတ်မှတ်
                .claim(
                        "tokenType",
                        "ACCESS"
                )

                // JWT unique ID
                .setId(
                        UUID.randomUUID()
                                .toString()
                )

                .setIssuer(
                        jwtIssuer
                )

                .setIssuedAt(
                        now
                )

                .setExpiration(
                        expiry
                )

                .signWith(
                        getSigningKey(),
                        SignatureAlgorithm.HS256
                )

                .compact();
    }


    // =========================================================
    // REFRESH TOKEN GENERATE
    // =========================================================

    public String generateRefreshToken(
            UUID customerId,
            String sessionUuid,
            long tokenVersion) {

        return generateRefreshToken(
                customerId, sessionUuid, tokenVersion,
                new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION)
        );
    }

    public String generateRefreshToken(
            UUID customerId,
            String sessionUuid,
            long tokenVersion,
            Date absoluteExpiry) {

        Date now =
                new Date();

        Date expiry =
                refreshExpiry(now, absoluteExpiry);


        return Jwts.builder()

                .setSubject(
                        customerId.toString()
                )

                .claim(
                        "sid",
                        sessionUuid
                )

                .claim(
                        "subjectType",
                        "CUSTOMER"
                )

                .claim(
                        "tokenVersion",
                        tokenVersion
                )

                .claim(
                        "tokenType",
                        "REFRESH"
                )

                .setId(
                        UUID.randomUUID()
                                .toString()
                )

                .setIssuer(
                        jwtIssuer
                )

                .setIssuedAt(
                        now
                )

                .setExpiration(
                        expiry
                )

                .signWith(
                        getSigningKey(),
                        SignatureAlgorithm.HS256
                )

                .compact();
    }


    // =========================================================
    // CORPORATE ACCESS TOKEN GENERATE
    // =========================================================

    public String generateCorporateAccessToken(
            UUID corporateUserId,
            String sessionUuid,
            long tokenVersion) {

        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpiration);

        return Jwts.builder()
                .setSubject(corporateUserId.toString())
                .claim("sid", sessionUuid)
                .claim("subjectType", "CORPORATE_USER")
                .claim("tokenVersion", tokenVersion)
                .claim("tokenType", "ACCESS")
                .setId(UUID.randomUUID().toString())
                .setIssuer(jwtIssuer)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // =========================================================
    // CORPORATE REFRESH TOKEN GENERATE
    // =========================================================

    public String generateCorporateRefreshToken(
            UUID corporateUserId,
            String sessionUuid,
            long tokenVersion) {

        return generateCorporateRefreshToken(
                corporateUserId, sessionUuid, tokenVersion,
                new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION)
        );
    }

    public String generateCorporateRefreshToken(
            UUID corporateUserId,
            String sessionUuid,
            long tokenVersion,
            Date absoluteExpiry) {

        Date now = new Date();
        Date expiry = refreshExpiry(now, absoluteExpiry);

        return Jwts.builder()
                .setSubject(corporateUserId.toString())
                .claim("sid", sessionUuid)
                .claim("subjectType", "CORPORATE_USER")
                .claim("tokenVersion", tokenVersion)
                .claim("tokenType", "REFRESH")
                .setId(UUID.randomUUID().toString())
                .setIssuer(jwtIssuer)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Date refreshExpiry(Date now, Date absoluteExpiry) {
        if (absoluteExpiry == null) {
            throw new IllegalArgumentException("Absolute session expiry is required.");
        }
        return new Date(Math.min(
                now.getTime() + REFRESH_TOKEN_EXPIRATION,
                absoluteExpiry.getTime()
        ));
    }

    // =========================================================
    // READ TOKEN CLAIMS
    // =========================================================

    public Claims getClaims(
            String token) {

        return Jwts.parserBuilder()

                .requireIssuer(
                        jwtIssuer
                )

                .setSigningKey(
                        getSigningKey()
                )

                .build()

                .parseClaimsJws(
                        token
                )

                .getBody();
    }
    
 
}
