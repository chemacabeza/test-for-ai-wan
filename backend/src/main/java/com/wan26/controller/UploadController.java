package com.wan26.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

/**
 * Proxies image uploads to fal.ai's CDN storage so the API key never
 * leaves the server. The frontend calls POST /api/videos/upload-image
 * with a multipart file, and gets back {"url": "https://...fal.media/..."}.
 */
@RestController
@RequestMapping("/videos")
@RequiredArgsConstructor
@Slf4j
public class UploadController {

    @Qualifier("falWebClient")
    private final WebClient falWebClient;

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        log.info("Uploading image to fal.ai CDN: {} ({} bytes)", file.getOriginalFilename(), file.getSize());

        try {
            byte[] bytes = file.getBytes();
            String contentType = file.getContentType() != null
                    ? file.getContentType() : "image/jpeg";

            // Use fal.ai's file storage API
            @SuppressWarnings("unchecked")
            Map<String, Object> response = falWebClient.post()
                    .uri("https://rest.alpha.fal.ai/storage/upload/initiate")
                    .bodyValue(Map.of(
                            "content_type", contentType,
                            "file_name", file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg"
                    ))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null || !response.containsKey("upload_url")) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Failed to initiate upload"));
            }

            String uploadUrl = (String) response.get("upload_url");
            String fileUrl = (String) response.get("file_url");

            // PUT the bytes to the pre-signed S3 URL
            WebClient.create().put()
                    .uri(uploadUrl)
                    .header("Content-Type", contentType)
                    .bodyValue(bytes)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();

            log.info("Image uploaded to fal.ai: {}", fileUrl);
            return ResponseEntity.ok(Map.of("url", fileUrl));

        } catch (Exception e) {
            log.error("Image upload failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
