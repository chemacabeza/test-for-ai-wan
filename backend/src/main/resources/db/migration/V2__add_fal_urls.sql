-- Add columns to store the exact status and response URLs returned by fal.ai at submission time.
-- These are used for polling (status URL) and fetching the result (response URL),
-- replacing the previously broken hand-constructed URLs.
ALTER TABLE video_jobs
    ADD COLUMN IF NOT EXISTS fal_status_url   TEXT,
    ADD COLUMN IF NOT EXISTS fal_response_url TEXT;
