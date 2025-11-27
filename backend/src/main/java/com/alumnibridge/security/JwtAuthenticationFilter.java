package com.alumnibridge.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, CustomUserDetailsService uds) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = uds;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = getJwtFromRequest(request);
        String path = request.getRequestURI();
        
        logger.info("🔐 JWT Filter - Path: {}", path);
        logger.info("  Token present: {}", token != null ? "YES" : "NO");
        
        if (StringUtils.hasText(token)) {
            logger.info("  Token length: {} chars", token.length());
            boolean isValid = tokenProvider.validateToken(token);
            logger.info("  Token validation result: {}", isValid ? "VALID" : "INVALID");
            
            if (isValid) {
                try {
                    String username = tokenProvider.getUsernameFromJWT(token);
                    logger.info("  Username from token: {}", username);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    logger.info("  UserDetails loaded: {}", userDetails.getClass().getSimpleName());
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    logger.info("  ✅ Authentication SET in SecurityContext");
                } catch (Exception e) {
                    logger.error("  ❌ Error processing valid token", e);
                }
            } else {
                logger.warn("  ⚠️  Token validation failed");
            }
        } else {
            logger.info("  ⚠️  No token in request headers");
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
