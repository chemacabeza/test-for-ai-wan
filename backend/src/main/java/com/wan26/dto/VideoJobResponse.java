package com.wan26.dto;

import com.wan26.model.JobStatus;
import com.wan26.model.VideoJob;
import com.wan26.model.VideoMode;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class VideoJobResponse {

    private UUID id;
    private VideoMode mode;
    private String prompt;
    private String imageUrl;
    private String aspectRatio;
    private String resolution;
    private Integer duration;
    private JobStatus status;
    private String falRequestId;
    private String videoUrl;
    private String videoContentType;
    private Long videoFileSize;
    private Integer videoWidth;
    private Integer videoHeight;
    private Double videoFps;
    private Double videoDuration;
    private String errorMessage;
    private Long seed;
    private String actualPrompt;
    private String model;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static VideoJobResponse from(VideoJob job) {
        return VideoJobResponse.builder()
                .id(job.getId())
                .mode(job.getMode())
                .prompt(job.getPrompt())
                .imageUrl(job.getImageUrl())
                .aspectRatio(job.getAspectRatio())
                .resolution(job.getResolution())
                .duration(job.getDuration())
                .status(job.getStatus())
                .falRequestId(job.getFalRequestId())
                .videoUrl(job.getVideoUrl())
                .videoContentType(job.getVideoContentType())
                .videoFileSize(job.getVideoFileSize())
                .videoWidth(job.getVideoWidth())
                .videoHeight(job.getVideoHeight())
                .videoFps(job.getVideoFps())
                .videoDuration(job.getVideoDuration())
                .errorMessage(job.getErrorMessage())
                .seed(job.getSeed())
                .actualPrompt(job.getActualPrompt())
                .model(job.getModel())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
