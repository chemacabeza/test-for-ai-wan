-- Add model column to track which fal.ai model was used for each job.
-- Defaults to 'wan-2.6' so existing rows retain their original model.
ALTER TABLE video_jobs
    ADD COLUMN IF NOT EXISTS model VARCHAR(64) DEFAULT 'wan-2.6';
