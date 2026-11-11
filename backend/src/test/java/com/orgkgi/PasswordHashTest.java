package com.orgkgi;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashTest {
    @Test
    void printHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "Password@123";
        String encoded = encoder.encode(rawPassword);
        System.out.println("BCRYPT_HASH_RESULT: " + encoded);
        assert encoder.matches(rawPassword, encoded);
    }
}
