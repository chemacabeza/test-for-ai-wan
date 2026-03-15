package com.wan26.controller;

import com.wan26.dto.ImageToVideoRequest;
import com.wan26.dto.TextToVideoRequest;
import com.wan26.dto.VideoJobResponse;
import com.wan26.service.VideoJobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/videos")
@RequiredArgsConstructor
@Slf4j
public class VideoController {

    private final VideoJobService videoJobService;
    private final WebClient.Builder webClientBuilder;

    @PostMapping("/text-to-video")
    public ResponseEntity<VideoJobResponse> createTextToVideo(@Valid @RequestBody TextToVideoRequest request) {
        log.info("POST /videos/text-to-video");
        VideoJobResponse response = videoJobService.createTextToVideoJob(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/image-to-video")
    public ResponseEntity<VideoJobResponse> createImageToVideo(@Valid @RequestBody ImageToVideoRequest request) {
        log.info("POST /videos/image-to-video");
        VideoJobResponse response = videoJobService.createImageToVideoJob(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<VideoJobResponse>> getAllJobs() {
        return ResponseEntity.ok(videoJobService.getAllJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoJobResponse> getJob(@PathVariable UUID id) {
        return ResponseEntity.ok(videoJobService.getJobById(id));
    }

    /**
     * Proxies the completed video from fal.ai CDN and forces a download with a unique,
     * descriptive filename — bypassing the browser's cross-origin download restriction.
     *
     * Filename format: wan_YYYY-MM-DD_HH-mm_1080p_16-9_15s.mp4
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadVideo(@PathVariable UUID id) {
        VideoJobResponse job = videoJobService.getJobById(id);

        if (job.getVideoUrl() == null || !"COMPLETED".equals(job.getStatus())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        // Build a descriptive, unique filename
        String timestamp = job.getCreatedAt() != null
            ? job.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm"))
            : "unknown";
        String aspectSafe = job.getAspectRatio() != null
            ? job.getAspectRatio().replace(":", "-")
            : "unknown";
        String filename = String.format("wan_%s_%s_%s_%ds.mp4",
            timestamp,
            job.getResolution() != null ? job.getResolution() : "unknown",
            aspectSafe,
            job.getDuration() != null ? job.getDuration() : 0);

        log.info("Proxying download for job {} -> {}", id, filename);

        byte[] videoBytes = webClientBuilder.build()
            .get()
            .uri(job.getVideoUrl())
            .retrieve()
            .bodyToMono(byte[].class)
            .block();

        if (videoBytes == null) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }

        String contentType = job.getVideoContentType() != null
            ? job.getVideoContentType()
            : "video/mp4";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType(contentType))
            .body(videoBytes);
    }

    @DeleteMapping("/{id}/cancel")
    public ResponseEntity<VideoJobResponse> cancelJob(@PathVariable UUID id) {
        log.info("DELETE /videos/{}/cancel", id);
        VideoJobResponse response = videoJobService.cancelJob(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable UUID id) {
        log.info("DELETE /videos/{}", id);
        videoJobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }
}
