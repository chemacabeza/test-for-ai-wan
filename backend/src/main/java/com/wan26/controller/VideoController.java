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
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/videos")
@RequiredArgsConstructor
@Slf4j
public class VideoController {

    private final VideoJobService videoJobService;

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
     * Uses streaming (HttpURLConnection) to avoid buffering the full video in memory.
     * Filename format: wan_YYYY-MM-DD_HH-mm_1080p_16-9_15s.mp4
     */
    @GetMapping("/download/{id}")
    public ResponseEntity<StreamingResponseBody> downloadVideo(@PathVariable UUID id) {
        VideoJobResponse job = videoJobService.getJobById(id);

        if (job.getVideoUrl() == null || job.getStatus() != com.wan26.model.JobStatus.COMPLETED) {
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

        log.info("Streaming download for job {} -> {}", id, filename);

        String videoUrl = job.getVideoUrl();
        StreamingResponseBody stream = outputStream -> {
            java.net.URL url = new java.net.URL(videoUrl);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(10_000);
            conn.setReadTimeout(120_000);
            try (java.io.InputStream in = conn.getInputStream()) {
                byte[] buf = new byte[64 * 1024]; // 64KB chunks
                int read;
                while ((read = in.read(buf)) != -1) {
                    outputStream.write(buf, 0, read);
                }
            } finally {
                conn.disconnect();
            }
        };

        String contentType = job.getVideoContentType() != null
            ? job.getVideoContentType()
            : "video/mp4";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType(contentType))
            .body(stream);
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
