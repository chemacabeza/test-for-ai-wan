package com.wan26.service;

import com.wan26.dto.ImageToVideoRequest;
import com.wan26.dto.TextToVideoRequest;
import com.wan26.dto.VideoJobResponse;
import com.wan26.model.JobStatus;
import com.wan26.model.VideoJob;
import com.wan26.model.VideoMode;
import com.wan26.repository.VideoJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoJobService {

    private final VideoJobRepository repository;
    private final FalAiService falAiService;

    // -------------------------------------------------------------------------
    // Create Text-to-Video Job
    // -------------------------------------------------------------------------
    @Transactional
    public VideoJobResponse createTextToVideoJob(TextToVideoRequest req) {
        // Build fal.ai payload
        Map<String, Object> payload = new HashMap<>();
        payload.put("prompt", req.getPrompt());
        payload.put("aspect_ratio", req.getAspectRatio());
        payload.put("resolution", req.getResolution());
        payload.put("duration", String.valueOf(req.getDuration()));
        payload.put("negative_prompt", req.getNegativePrompt());
        payload.put("enable_prompt_expansion", req.getEnablePromptExpansion());
        payload.put("multi_shots", req.getMultiShots());
        payload.put("enable_safety_checker", true);
        if (req.getSeed() != null) payload.put("seed", req.getSeed());

        // Submit to fal.ai
        FalAiService.FalQueueResponse queueResponse = falAiService.submitTextToVideo(payload);

        // Persist job
        VideoJob job = VideoJob.builder()
                .mode(VideoMode.TEXT_TO_VIDEO)
                .prompt(req.getPrompt())
                .aspectRatio(req.getAspectRatio())
                .resolution(req.getResolution())
                .duration(req.getDuration())
                .negativePrompt(req.getNegativePrompt())
                .enablePromptExpansion(req.getEnablePromptExpansion())
                .multiShots(req.getMultiShots())
                .seed(req.getSeed())
                .status(queueResponse != null ? JobStatus.IN_QUEUE : JobStatus.FAILED)
                .falRequestId(queueResponse != null ? queueResponse.getRequestId() : null)
                .errorMessage(queueResponse == null ? "Failed to submit job to fal.ai" : null)
                .build();

        job = repository.save(job);
        log.info("Created T2V job {} with falRequestId={}", job.getId(), job.getFalRequestId());
        return VideoJobResponse.from(job);
    }

    // -------------------------------------------------------------------------
    // Create Image-to-Video Job
    // -------------------------------------------------------------------------
    @Transactional
    public VideoJobResponse createImageToVideoJob(ImageToVideoRequest req) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("prompt", req.getPrompt());
        payload.put("image_url", req.getImageUrl());
        payload.put("resolution", req.getResolution());
        payload.put("duration", String.valueOf(req.getDuration()));
        payload.put("negative_prompt", req.getNegativePrompt());
        payload.put("enable_prompt_expansion", req.getEnablePromptExpansion());
        payload.put("multi_shots", req.getMultiShots());
        payload.put("enable_safety_checker", true);
        if (req.getSeed() != null) payload.put("seed", req.getSeed());

        FalAiService.FalQueueResponse queueResponse = falAiService.submitImageToVideo(payload);

        VideoJob job = VideoJob.builder()
                .mode(VideoMode.IMAGE_TO_VIDEO)
                .prompt(req.getPrompt())
                .imageUrl(req.getImageUrl())
                .resolution(req.getResolution())
                .duration(req.getDuration())
                .negativePrompt(req.getNegativePrompt())
                .enablePromptExpansion(req.getEnablePromptExpansion())
                .multiShots(req.getMultiShots())
                .seed(req.getSeed())
                .status(queueResponse != null ? JobStatus.IN_QUEUE : JobStatus.FAILED)
                .falRequestId(queueResponse != null ? queueResponse.getRequestId() : null)
                .errorMessage(queueResponse == null ? "Failed to submit job to fal.ai" : null)
                .build();

        job = repository.save(job);
        log.info("Created I2V job {} with falRequestId={}", job.getId(), job.getFalRequestId());
        return VideoJobResponse.from(job);
    }

    // -------------------------------------------------------------------------
    // Query Jobs
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<VideoJobResponse> getAllJobs() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(VideoJobResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public VideoJobResponse getJobById(UUID id) {
        return repository.findById(id)
                .map(VideoJobResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + id));
    }
}
