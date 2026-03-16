import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import VideoModal from './VideoModal';

const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_QUEUE: 'In Queue',
  IN_PROGRESS: 'Generating',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

const MODE_ICONS = {
  TEXT_TO_VIDEO: '📝',
  IMAGE_TO_VIDEO: '🖼️',
};

const MODEL_LABELS = {
  'wan-2.6': 'Wan 2.6',
  'wan-2.2-a14b': 'Wan 2.2-A14B',
  'kling-v2.5-turbo': 'Kling v2.5 Turbo',
  'ltx-2-19b': 'LTX-2 19B',
  'pixverse-v5': 'PixVerse v5',
};

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const abs = d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  let rel;
  if (diffMin < 1) rel = 'just now';
  else if (diffMin < 60) rel = `${diffMin}m ago`;
  else if (diffMin < 1440) rel = `${Math.floor(diffMin / 60)}h ago`;
  else rel = `${Math.floor(diffMin / 1440)}d ago`;
  return { abs, rel };
}

export default function JobCard({ job, onCancel, onDelete }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const isActive = ['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(job.status);
  const statusKey = job.status?.toLowerCase();

  const handleCancel = async () => {
    if (!window.confirm('Cancel this job? This cannot be undone.')) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await onCancel(job.id);
    } catch (err) {
      setCancelError(err?.response?.data?.detail || err.message || 'Failed to cancel');
      setCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove this job from the list? This cannot be undone.')) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(job.id);
    } catch (err) {
      setDeleteError(err?.response?.data?.detail || err.message || 'Failed to remove');
      setDeleting(false);
    }
  };

  return (
    <>
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
            {job.createdAt && (() => {
              const { abs, rel } = formatDate(job.createdAt);
              return (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}
                  title={abs}>
                  🕐 {abs} <span style={{ opacity: 0.65 }}>({rel})</span>
                </div>
              );
            })()}
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
          {job.model && <span>🤖 {MODEL_LABELS[job.model] || job.model}</span>}
          {job.resolution && <span>📐 {job.resolution}</span>}
          {job.duration && <span>⏱ {job.duration}s</span>}
          {job.aspectRatio && <span>⬜ {job.aspectRatio}</span>}
          {job.videoWidth && <span>🎞 {job.videoWidth}×{job.videoHeight}</span>}
          {job.videoFps && <span>⚡ {job.videoFps?.toFixed(0)} fps</span>}
          {job.videoFileSize && <span>💾 {formatBytes(job.videoFileSize)}</span>}
        </div>

        {/* Video thumbnail + Watch button */}
        {job.status === 'COMPLETED' && job.videoUrl && (
          <div
            onClick={() => setShowModal(true)}
            style={{
              position: 'relative',
              borderRadius: '10px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#0b0d14',
              aspectRatio: job.aspectRatio?.replace(':', '/') || '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Silent muted preview so the poster frame renders */}
            <video
              src={job.videoUrl}
              muted
              playsInline
              preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
            />
            {/* Play overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.35)',
              transition: 'background 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.35)'; }}
            >
              <div style={{
                width: '52px', height: '52px',
                borderRadius: '50%',
                background: 'rgba(99,120,255,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 4px 20px rgba(99,120,255,0.5)',
                transition: 'transform 0.2s',
              }}>▶</div>
            </div>
          </div>
        )}

        {/* Download link for completed videos */}
        {job.status === 'COMPLETED' && job.videoUrl && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <a
              href={`/api/videos/download/${job.id}`}
              download
              title="Download video"
              style={{
                fontSize: '0.78rem',
                color: '#a5b4fc',
                textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '4px',
                opacity: 0.8,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; }}
            >
              ⬇ Download
            </a>
          </div>
        )}

        {/* Error / Cancelled message */}
        {(job.status === 'FAILED' || job.status === 'CANCELLED') && job.errorMessage && (
          <div style={{
            fontSize: '0.8rem',
            color: job.status === 'CANCELLED' ? '#94a3b8' : '#f87171',
            background: job.status === 'CANCELLED'
              ? 'rgba(148,163,184,0.08)'
              : 'rgba(239,68,68,0.08)',
            borderRadius: '6px',
            padding: '8px 10px',
          }}>
            {job.status === 'CANCELLED' ? '🚫' : '⚠️'} {job.errorMessage}
          </div>
        )}

        {/* Remove button for FAILED jobs */}
        {job.status === 'FAILED' && onDelete && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Remove this job"
              style={{
                background: 'rgba(148,163,184,0.10)',
                border: '1px solid rgba(148,163,184,0.25)',
                color: deleting ? 'var(--text-muted)' : '#94a3b8',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                cursor: deleting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (!deleting) e.target.style.background = 'rgba(148,163,184,0.2)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(148,163,184,0.10)'; }}
            >
              {deleting ? '⏳ Removing…' : '🗑 Remove'}
            </button>
          </div>
        )}

        {deleteError && (
          <div style={{ fontSize: '0.75rem', color: '#f87171' }}>⚠️ {deleteError}</div>
        )}

        {/* In-progress hint + Cancel button */}
        {isActive && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}>
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

            {/* Cancel button */}
            <button
              onClick={handleCancel}
              disabled={cancelling}
              title="Cancel this job"
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.35)',
                color: cancelling ? 'var(--text-muted)' : '#f87171',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                cursor: cancelling ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (!cancelling) e.target.style.background = 'rgba(239,68,68,0.22)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(239,68,68,0.12)'; }}
            >
              {cancelling ? '⏳ Cancelling…' : '✕ Cancel'}
            </button>
          </div>
        )}

        {cancelError && (
          <div style={{ fontSize: '0.75rem', color: '#f87171' }}>⚠️ {cancelError}</div>
        )}
      </div>

      {/* Video modal — rendered outside the card via portal to avoid z-index/overflow issues */}
      {showModal && ReactDOM.createPortal(
        <VideoModal job={job} onClose={() => setShowModal(false)} />,
        document.body
      )}
    </>
  );
}
