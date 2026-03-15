package com.wan26.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfig {

    @Value("${fal.api.key}")
    private String falApiKey;

    @Value("${fal.api.base-url}")
    private String falBaseUrl;

    @Bean(name = "falWebClient")
    public WebClient falWebClient() throws Exception {

        // Explicit Java-based SSL context — avoids native OpenSSL which
        // behaves differently inside Docker bridge networks with MTU issues
        var sslContext = SslContextBuilder.forClient()
                .trustManager(InsecureTrustManagerFactory.INSTANCE)
                .build();

        HttpClient httpClient = HttpClient.create()
                // Secure config: extend SSL handshake timeout well past the 10s default
                // to handle Docker bridge network MTU-induced packet fragmentation
                .secure(spec -> spec
                        .sslContext(sslContext)
                        .handshakeTimeout(Duration.ofSeconds(30))
                        .closeNotifyFlushTimeout(Duration.ofSeconds(10))
                        .closeNotifyReadTimeout(Duration.ofSeconds(10)))
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 30_000)
                .option(ChannelOption.SO_KEEPALIVE, true)
                .responseTimeout(Duration.ofSeconds(60))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(60, TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(30, TimeUnit.SECONDS)));

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .baseUrl(falBaseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Key " + falApiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .codecs(configurer -> configurer.defaultCodecs()
                        .maxInMemorySize(10 * 1024 * 1024)) // 10MB
                .build();
    }
}
