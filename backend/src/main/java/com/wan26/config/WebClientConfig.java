package com.wan26.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${fal.api.key}")
    private String falApiKey;

    @Value("${fal.api.base-url}")
    private String falBaseUrl;

    @Bean(name = "falWebClient")
    public WebClient falWebClient() {
        return WebClient.builder()
                .baseUrl(falBaseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Key " + falApiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .codecs(configurer -> configurer.defaultCodecs()
                        .maxInMemorySize(10 * 1024 * 1024)) // 10MB
                .build();
    }
}
