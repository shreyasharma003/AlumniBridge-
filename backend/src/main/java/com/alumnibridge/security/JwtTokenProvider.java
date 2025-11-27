package com.alumnibridge.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {
    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-millis}")
    private long jwtExpirationInMs;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(org.springframework.security.core.userdetails.UserDetails userDetails) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            logger.debug("✅ Token validation successful");
            return true;
        } catch (ExpiredJwtException ex) {
            logger.warn("⏰ Token expired: {}", ex.getMessage());
            return false;
        } catch (UnsupportedJwtException ex) {
            logger.warn("❌ Unsupported token: {}", ex.getMessage());
            return false;
        } catch (MalformedJwtException ex) {
            logger.warn("❌ Malformed token: {}", ex.getMessage());
            return false;
        } catch (SignatureException ex) {
            logger.warn("❌ Invalid signature: {}", ex.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException ex) {
            logger.warn("❌ JWT validation error: {}", ex.getMessage());
            return false;
        }
    }
}
