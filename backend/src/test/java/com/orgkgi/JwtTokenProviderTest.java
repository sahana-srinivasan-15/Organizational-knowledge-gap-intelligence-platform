package com.orgkgi;

import com.orgkgi.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(secret, 3600000L); // 1 hour
    }

    @Test
    void testGenerateAndValidateValidToken() {
        String token = tokenProvider.generateTokenFromUser(100L, "test.user@orgkgi.dev", "EMPLOYEE");
        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));

        assertEquals("test.user@orgkgi.dev", tokenProvider.getEmailFromToken(token));
        assertEquals(100L, tokenProvider.getUserIdFromToken(token));
        assertEquals("EMPLOYEE", tokenProvider.getRoleFromToken(token));
    }

    @Test
    void testValidateMalformedTokenFails() {
        String malformedToken = "eyJhbGciOiJIUzI1NiJ9.invalidPayload.invalidSignature";
        assertFalse(tokenProvider.validateToken(malformedToken));
    }

    @Test
    void testValidateExpiredTokenFails() throws InterruptedException {
        // Create a provider with 1 millisecond expiration
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(secret, 1L);
        String token = shortLivedProvider.generateTokenFromUser(100L, "expired@orgkgi.dev", "EMPLOYEE");

        Thread.sleep(10); // Wait for expiration

        assertFalse(shortLivedProvider.validateToken(token));
    }

    @Test
    void testValidateEmptyTokenFails() {
        assertFalse(tokenProvider.validateToken(""));
        assertFalse(tokenProvider.validateToken(null));
    }
}
