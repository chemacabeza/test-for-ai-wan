package com.wan26.scheduler;

import com.wan26.model.JobStatus;
import com.wan26.model.VideoJob;
import com.wan26.repository.VideoJobRepository;
import com.wan26.service.FalAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobPollingScheduler {

    private final VideoJobRepository repository;
    private final FalAiService falAiService;

    @Scheduled(fixedDelay = 15000) // every 15 seconds
    @Transactional
    public void pollActiveJobs() {
        List<VideoJob> activeJobs = repository.findByStatusInOrderByCreatedAtDesc(
                List.of(JobStatus.IN_QUEUE, JobStatus.IN_PROGRESS, JobStatus.PENDING));

        if (activeJobs.isEmpty()) {
            return;
        }

        log.info("Polling {} active job(s)", activeJobs.size());

        for (VideoJob job : activeJobs) {
            if (job.getFalRequestId() == null) {
                continue;
            }
            // Double-check: skip if job was cancelled between query and iteration
            if (job.getStatus() == JobStatus.CANCELLED) {
                continue;
            }
            // Must have stored URLs — if not, skip (old data without URLs)
            if (job.getFalStatusUrl() == null) {
                log.warn("Job {} has no falStatusUrl stored, cannot poll", job.getId());
                continue;
            }
            try {
                FalAiService.FalStatusResponse statusResponse =
                        falAiService.pollStatus(job.getFalStatusUrl());

                if (statusResponse == null) {
                    continue;
                }

                String falStatus = statusResponse.getStatus();
                log.debug("Job {} fal.ai status: {}", job.getId(), falStatus);

                switch (falStatus) {
                    case "IN_QUEUE"    -> job.setStatus(JobStatus.IN_QUEUE);
                    case "IN_PROGRESS" -> job.setStatus(JobStatus.IN_PROGRESS);
                    case "COMPLETED"   -> {
                        String responseUrl = job.getFalResponseUrl() != null
                                ? job.getFalResponseUrl()
                                : statusResponse.getResponseUrl();
                        FalAiService.FalResultResponse result =
                                falAiService.fetchResult(responseUrl);
                        if (result != null && result.getVideo() != null) {
                            FalAiService.VideoFileResponse video = result.getVideo();
                            job.setStatus(JobStatus.COMPLETED);
                            job.setVideoUrl(video.getUrl());
                            job.setVideoContentType(video.getContentType());
                            job.setVideoFileSize(video.getFileSize());
                            job.setVideoWidth(video.getWidth());
                            job.setVideoHeight(video.getHeight());
                            job.setVideoFps(video.getFps());
                            job.setVideoDuration(video.getDuration());
                            job.setSeed(result.getSeed());
                            job.setActualPrompt(result.getActualPrompt());
                            log.info("Job {} COMPLETED — videoUrl={}", job.getId(), video.getUrl());
                        } else {
                            job.setStatus(JobStatus.FAILED);
                            job.setErrorMessage("fal.ai returned COMPLETED but no video in result");
                        }
                    }
                    case "FAILED" -> {
                        job.setStatus(JobStatus.FAILED);
                        job.setErrorMessage("fal.ai reported job failure");
                        log.warn("Job {} FAILED", job.getId());
                    }
                    default -> log.warn("Unknown fal.ai status '{}' for job {}", falStatus, job.getId());
                }

                repository.save(job);
            } catch (Exception e) {
                log.error("Error polling job {}: {}", job.getId(), e.getMessage(), e);
                // Mark as FAILED so it surfaces in the UI and doesn't stay stuck forever
                try {
                    job.setStatus(JobStatus.FAILED);
                    job.setErrorMessage("Polling error: " + e.getMessage());
                    repository.save(job);
                } catch (Exception saveEx) {
                    log.error("Failed to mark job {} as FAILED after polling error: {}", job.getId(), saveEx.getMessage());
                }
            }
        }
    }
}
