package com.wan26.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ImageToVideoRequest {

    @NotBlank(message = "Prompt is required")
    @Size(max = 3000, message = "Prompt must be at most 3000 characters")
    private String prompt;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    @Size(max = 3000, message = "Negative prompt must be at most 3000 characters")
    private String negativePrompt = "";

    @Pattern(regexp = "720p|1080p", message = "Resolution must be 720p or 1080p")
    private String resolution = "1080p";

    @Min(value = 5)
    @Max(value = 15)
    private Integer duration = 5;

    private Boolean enablePromptExpansion = true;

    private Boolean multiShots = false;

    private Long seed;

    @Pattern(regexp = "wan-2\\.6|wan-2\\.2-a14b|kling-v2\\.5-turbo|ltx-2-19b|pixverse-v5", message = "Invalid model ID")
    private String model = "wan-2.6";
}
