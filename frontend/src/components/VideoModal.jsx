import React, { useEffect, useRef } from 'react';

/**
 * Full-screen-style modal for watching a completed video.
 * Closes on Escape key, backdrop click, or the × button.
 */
export default function VideoModal({ job, onClose }) {
  const videoRef = useRef(null);

  // Auto-play when modal opens
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {}); // ignore autoplay policy errors
    }

    // Close on Escape
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      {/* Modal panel */}
      <div style={{
        width: '100%', maxWidth: '960px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#e2e8f0' }}>
              {job.actualPrompt || job.prompt}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {[job.resolution, job.duration && `${job.duration}s`, job.aspectRatio,
                job.videoWidth && `${job.videoWidth}×${job.videoHeight}`,
                job.videoFps && `${Math.round(job.videoFps)} fps`]
                .filter(Boolean).join(' · ')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {/* Download */}
            <a
              href={`/api/videos/${job.id}/download`}
              download
              title="Download video"
              style={{
                background: 'rgba(99,120,255,0.15)',
                border: '1px solid rgba(99,120,255,0.35)',
                color: '#a5b4fc',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '1rem',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,120,255,0.28)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,120,255,0.15)'; }}
            >
              ⬇ Download
            </a>
            {/* Close */}
            <button
              onClick={onClose}
              title="Close (Esc)"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#e2e8f0',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.16)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)'; }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Video player */}
        <video
          ref={videoRef}
          controls
          loop
          playsInline
          src={job.videoUrl}
          style={{
            width: '100%',
            maxHeight: 'calc(100vh - 160px)',
            borderRadius: '12px',
            background: '#000',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            outline: 'none',
          }}
        />

        {/* Tip */}
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
          Click outside or press Esc to close · Use browser's fullscreen button (⛶) for true fullscreen
        </div>
      </div>
    </div>
  );
}
