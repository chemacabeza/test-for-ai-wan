import React from 'react';

const STATUS_LABELS = {
  PENDING:     'Pending',
  IN_QUEUE:    'In Queue',
  IN_PROGRESS: 'Generating',
  COMPLETED:   'Completed',
  FAILED:      'Failed',
};

const MODE_ICONS = {
  TEXT_TO_VIDEO:  '📝',
  IMAGE_TO_VIDEO: '🖼️',
};

function formatDuration(secs) {
  if (!secs) return '';
  return `${secs.toFixed(1)}s`;
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function JobCard({ job }) {
  const isActive = ['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(job.status);
  const statusKey = job.status?.toLowerCase();

  return (
    <div className="glass-card job-card">
      {/* Header */}
      <div className="job-card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="job-card-mode">
            {MODE_ICONS[job.mode]} {job.mode === 'TEXT_TO_VIDEO' ? 'Text-to-Video' : 'Image-to-Video'}
          </div>
          <span className={`badge badge-${statusKey}`}>
            {isActive && <span className="pulse" />}
            {STATUS_LABELS[job.status] || job.status}
          </span>
        </div>

        {/* Thumbnail for I2V */}
        {job.imageUrl && (
          <img
            src={job.imageUrl}
            alt="Source"
            className="job-card-image-thumb"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
      </div>

      {/* Prompt */}
      <p className="job-card-prompt" title={job.actualPrompt || job.prompt}>
        {job.actualPrompt || job.prompt}
      </p>

      {/* Meta */}
      <div className="job-card-meta">
        {job.resolution && <span>📐 {job.resolution}</span>}
        {job.duration  && <span>⏱ {job.duration}s</span>}
        {job.aspectRatio && <span>⬜ {job.aspectRatio}</span>}
        {job.videoWidth  && <span>🎞 {job.videoWidth}×{job.videoHeight}</span>}
        {job.videoFps    && <span>⚡ {job.videoFps?.toFixed(0)} fps</span>}
        {job.videoFileSize && <span>💾 {formatBytes(job.videoFileSize)}</span>}
      </div>

      {/* Video Player */}
      {job.status === 'COMPLETED' && job.videoUrl && (
        <video
          className="video-player"
          controls
          autoPlay={false}
          loop
          muted
          playsInline
          src={job.videoUrl}
          type={job.videoContentType || 'video/mp4'}
        />
      )}

      {/* Error */}
      {job.status === 'FAILED' && job.errorMessage && (
        <div style={{
          fontSize: '0.8rem',
          color: '#f87171',
          background: 'rgba(239,68,68,0.08)',
          borderRadius: '6px',
          padding: '8px 10px',
        }}>
          ⚠️ {job.errorMessage}
        </div>
      )}

      {/* In-progress hint */}
      {isActive && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}>
          <div style={{
            width: '14px', height: '14px',
            border: '2px solid rgba(99,120,255,0.3)',
            borderTopColor: 'var(--accent-1)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          Video generation takes 2–5 minutes. Polling automatically…
        </div>
      )}

      {/* Date */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
        {formatDate(job.createdAt)}
      </div>
    </div>
  );
}
