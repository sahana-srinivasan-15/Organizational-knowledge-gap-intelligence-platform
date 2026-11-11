package com.orgkgi.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Organizational Knowledge Gap Intelligence Platform API",
        version = "v1.0",
        description = "Enterprise API for talent intelligence, skill gap analytics, dynamic mentorship, and training outcome evaluation.",
        contact = @Contact(name = "Engineering Team", email = "engineering@orgkgi.dev")
    )
)
@SecurityScheme(
    name = "BearerAuth",
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    scheme = "bearer",
    description = "Enter JWT access token issued by /api/v1/auth/login"
)
public class OpenApiConfig {
}
