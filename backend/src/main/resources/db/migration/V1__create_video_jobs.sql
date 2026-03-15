CREATE TABLE video_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode VARCHAR(20) NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT,
    aspect_ratio VARCHAR(10),
    resolution VARCHAR(10) NOT NULL DEFAULT '1080p',
    duration INTEGER NOT NULL DEFAULT 5,
    negative_prompt TEXT,
    enable_prompt_expansion BOOLEAN NOT NULL DEFAULT TRUE,
    multi_shots BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    fal_request_id VARCHAR(255),
    video_url TEXT,
    video_content_type VARCHAR(50),
    video_file_size BIGINT,
    video_width INTEGER,
    video_height INTEGER,
    video_fps DOUBLE PRECISION,
    video_duration DOUBLE PRECISION,
    error_message TEXT,
    seed BIGINT,
    actual_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_video_jobs_status ON video_jobs(status);
CREATE INDEX idx_video_jobs_created_at ON video_jobs(created_at DESC);
CREATE INDEX idx_video_jobs_fal_request_id ON video_jobs(fal_request_id) WHERE fal_request_id IS NOT NULL;
