package com.orgkgi.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Configuration and client factory for OpenAI API integrations.
 */
@Configuration
public class OpenAiConfig {

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.api.url:https://api.openai.com/v1}")
    private String apiUrl;

    @Value("${openai.api.model:gpt-4o-mini}")
    private String model;

    @Value("${openai.api.timeout-ms:15000}")
    private int timeoutMs;

    @Value("${openai.api.enabled:true}")
    private boolean enabled;

    @Bean
    public RestClient openAiRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(timeoutMs));
        factory.setReadTimeout(Duration.ofMillis(timeoutMs));

        return RestClient.builder()
                .baseUrl(apiUrl != null && !apiUrl.isBlank() ? apiUrl : "https://api.openai.com/v1")
                .requestFactory(factory)
                .build();
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public String getModel() {
        return model;
    }

    public int getTimeoutMs() {
        return timeoutMs;
    }

    public boolean isEnabled() {
        return enabled;
    }
}

