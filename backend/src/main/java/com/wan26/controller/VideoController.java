package com.wan26.controller;

import com.wan26.dto.ImageToVideoRequest;
import com.wan26.dto.TextToVideoRequest;
import com.wan26.dto.VideoJobResponse;
import com.wan26.service.VideoJobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
