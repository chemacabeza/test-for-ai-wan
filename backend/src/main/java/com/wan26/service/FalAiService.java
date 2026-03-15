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

    private static final String T2V_ENDPOINT = "/wan/v2.6/text-to-video";
    private static final String I2V_ENDPOINT = "/wan/v2.6/image-to-video";

    private final WebClient falWebClient;

    public FalAiService(@Qualifier("falWebClient") WebClient falWebClient) {
        this.falWebClient = falWebClient;
    }

    // -------------------------------------------------------------------------
    // Submit Text-to-Video
    // -------------------------------------------------------------------------
    public FalQueueResponse submitTextToVideo(Map<String, Object> payload) {
        log.info("Submitting T2V request to fal.ai: {}", payload.get("prompt"));
        return falWebClient.post()
                .uri(T2V_ENDPOINT)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(FalQueueResponse.class)
                .block();
    }

    // -------------------------------------------------------------------------
    // Submit Image-to-Video
    // -------------------------------------------------------------------------
    public FalQueueResponse submitImageToVideo(Map<String, Object> payload) {
        log.info("Submitting I2V request to fal.ai");
        return falWebClient.post()
                .uri(I2V_ENDPOINT)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(FalQueueResponse.class)
                .block();
    }

    // -------------------------------------------------------------------------
    // Poll Job Status
    // -------------------------------------------------------------------------
    public FalStatusResponse pollStatus(String endpoint, String requestId) {
        String statusPath = "/" + endpoint + "/requests/" + requestId + "/status?logs=1";
        log.debug("Polling fal.ai status for requestId={}", requestId);
        return falWebClient.get()
                .uri(statusPath)
                .retrieve()
                .bodyToMono(FalStatusResponse.class)
                .onErrorResume(e -> {
                    log.error("Error polling status for {}: {}", requestId, e.getMessage());
                    return Mono.empty();
                })
                .block();
    }

    // -------------------------------------------------------------------------
    // Fetch Result
    // -------------------------------------------------------------------------
    public FalResultResponse fetchResult(String endpoint, String requestId) {
        String resultPath = "/" + endpoint + "/requests/" + requestId;
        log.info("Fetching result for requestId={}", requestId);
        return falWebClient.get()
                .uri(resultPath)
                .retrieve()
                .bodyToMono(FalResultResponse.class)
                .onErrorResume(e -> {
                    log.error("Error fetching result for {}: {}", requestId, e.getMessage());
                    return Mono.empty();
                })
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
