package com.wan26.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TextToVideoRequest {

    @NotBlank(message = "Prompt is required")
    @Size(max = 800, message = "Prompt must be at most 800 characters")
    private String prompt;

    @Size(max = 500, message = "Negative prompt must be at most 500 characters")
    private String negativePrompt = "";

    @Pattern(regexp = "21:9|16:9|3:2|4:3|5:4|1:1|4:5|3:4|2:3|9:16|9:21", message = "Invalid aspect ratio")
    private String aspectRatio = "16:9";

    @Pattern(regexp = "720p|1080p", message = "Resolution must be 720p or 1080p")
    private String resolution = "1080p";

    @Min(value = 5) @Max(value = 15)
    private Integer duration = 5;

    private Boolean enablePromptExpansion = true;

    private Boolean multiShots = true;

    private Long seed;
}
