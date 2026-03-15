package com.wan26.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "video_jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VideoMode mode;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "aspect_ratio")
    private String aspectRatio;

    @Column(nullable = false)
    private String resolution;

    @Column(nullable = false)
    private Integer duration;

    @Column(name = "negative_prompt", columnDefinition = "TEXT")
    private String negativePrompt;

    @Column(name = "enable_prompt_expansion")
    private Boolean enablePromptExpansion;

    @Column(name = "multi_shots")
    private Boolean multiShots;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private JobStatus status = JobStatus.PENDING;

    @Column(name = "fal_request_id")
    private String falRequestId;

    @Column(name = "fal_status_url", columnDefinition = "TEXT")
    private String falStatusUrl;

    @Column(name = "fal_response_url", columnDefinition = "TEXT")
    private String falResponseUrl;

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "video_content_type")
    private String videoContentType;

    @Column(name = "video_file_size")
    private Long videoFileSize;

    @Column(name = "video_width")
    private Integer videoWidth;

    @Column(name = "video_height")
    private Integer videoHeight;

    @Column(name = "video_fps")
    private Double videoFps;

    @Column(name = "video_duration")
    private Double videoDuration;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    private Long seed;

    @Column(name = "actual_prompt", columnDefinition = "TEXT")
    private String actualPrompt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
