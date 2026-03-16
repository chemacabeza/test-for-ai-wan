package com.wan26.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
@Slf4j
public class FalAiService {

    // Model-id → fal.ai queue path
    private static final java.util.Map<String, String> T2V_ENDPOINTS = java.util.Map.of(
            "wan-2.6", "/wan/v2.6/text-to-video",
            "wan-2.2-a14b", "/wan/v2.2-a14b/text-to-video",
            "kling-v2.5-turbo", "/kling-video/v2.5-turbo/pro/text-to-video",
            "ltx-2-19b", "/ltx-2-19b/text-to-video",
            "pixverse-v5", "/pixverse/v5/text-to-video");

    private static final java.util.Map<String, String> I2V_ENDPOINTS = java.util.Map.of(
            "wan-2.6", "/wan/v2.6/image-to-video",
            "wan-2.2-a14b", "/wan/v2.2-a14b/image-to-video",
            "kling-v2.5-turbo", "/kling-video/v2.5-turbo/pro/image-to-video",
            "ltx-2-19b", "/ltx-2-19b/image-to-video",
            "pixverse-v5", "/pixverse/v5/image-to-video");

    private final WebClient falWebClient;

    public FalAiService(@Qualifier("falWebClient") WebClient falWebClient) {
        this.falWebClient = falWebClient;
    }

    // -------------------------------------------------------------------------
    // Submit Text-to-Video
    // -------------------------------------------------------------------------
    public FalQueueResponse submitTextToVideo(Map<String, Object> payload, String model) {
        String endpoint = T2V_ENDPOINTS.getOrDefault(model, T2V_ENDPOINTS.get("wan-2.6"));
        log.info("Submitting T2V request to fal.ai [{}]: {}", endpoint, payload.get("prompt"));
        return falWebClient.post()
                .uri(endpoint)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(FalQueueResponse.class)
                .block();
    }

    // -------------------------------------------------------------------------
    // Submit Image-to-Video
    // -------------------------------------------------------------------------
    public FalQueueResponse submitImageToVideo(Map<String, Object> payload, String model) {
        String endpoint = I2V_ENDPOINTS.getOrDefault(model, I2V_ENDPOINTS.get("wan-2.6"));
        log.info("Submitting I2V request to fal.ai [{}]", endpoint);
        return falWebClient.post()
                .uri(endpoint)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(FalQueueResponse.class)
                .block();
    }

    // -------------------------------------------------------------------------
    // Poll Job Status — uses the exact status_url returned at submission time
    // -------------------------------------------------------------------------
    public FalStatusResponse pollStatus(String statusUrl) {
        log.debug("Polling fal.ai status at {}", statusUrl);
        return falWebClient.get()
                .uri(java.net.URI.create(statusUrl + "?logs=1"))
                .retrieve()
                .bodyToMono(FalStatusResponse.class)
                .onErrorResume(e -> {
                    log.error("Error polling status at {}: {}", statusUrl, e.getMessage());
                    return Mono.empty();
                })
                .block();
    }

    // -------------------------------------------------------------------------
    // Fetch Result — uses the exact response_url returned at submission time
    // -------------------------------------------------------------------------
    public FalResultResponse fetchResult(String responseUrl) {
        log.info("Fetching result at {}", responseUrl);
        return falWebClient.get()
                .uri(java.net.URI.create(responseUrl))
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(),
                        clientResponse -> clientResponse.bodyToMono(String.class).flatMap(body -> {
                            String msg;
                            if (clientResponse.statusCode().value() == 422
                                    && body.contains("content_policy_violation")) {
                                msg = "Content policy violation — fal.ai rejected this prompt";
                            } else {
                                msg = "fal.ai result fetch failed: HTTP " + clientResponse.statusCode().value() + " — "
                                        + body;
                            }
                            log.error("Error fetching result at {}: {}", responseUrl, msg);
                            return Mono.error(new RuntimeException(msg));
                        }))
                .bodyToMono(FalResultResponse.class)
                .block();
    }

    // -------------------------------------------------------------------------
    // Response DTOs
    // -------------------------------------------------------------------------

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FalQueueResponse {
        @JsonProperty("request_id")
        private String requestId;
        @JsonProperty("response_url")
        private String responseUrl;
        @JsonProperty("status_url")
        private String statusUrl;
        @JsonProperty("cancel_url")
        private String cancelUrl;
        private String status;
        @JsonProperty("queue_position")
        private Integer queuePosition;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FalStatusResponse {
        private String status;
        @JsonProperty("request_id")
        private String requestId;
        @JsonProperty("queue_position")
        private Integer queuePosition;
        @JsonProperty("response_url")
        private String responseUrl;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FalResultResponse {
        private VideoFileResponse video;
        private Long seed;
        @JsonProperty("actual_prompt")
        private String actualPrompt;
        private String error;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VideoFileResponse {
        private String url;
        @JsonProperty("content_type")
        private String contentType;
        @JsonProperty("file_name")
        private String fileName;
        @JsonProperty("file_size")
        private Long fileSize;
        private Integer width;
        private Integer height;
        private Double fps;
        private Double duration;
        @JsonProperty("num_frames")
        private Integer numFrames;
    }
}
