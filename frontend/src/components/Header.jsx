import React from 'react';

export default function Header() {
  return (
    <header style={{
      background: 'rgba(8, 11, 20, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(99, 120, 255, 0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6378ff, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            boxShadow: '0 4px 16px rgba(99,120,255,0.4)',
          }}>
            🎬
          </div>
          <div>
            <div style={{
              fontWeight: 800,
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #6378ff, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Wan 2.6 Studio
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-2px' }}>
              AI Video Generator
            </div>
          </div>
        </div>

        {/* Tag */}
        <div style={{
          padding: '5px 12px',
          borderRadius: '100px',
          background: 'rgba(99,120,255,0.12)',
          border: '1px solid rgba(99,120,255,0.25)',
          fontSize: '0.78rem',
          color: '#8fa0ff',
          fontWeight: 500,
        }}>
          Powered by fal.ai
        </div>
      </div>
    </header>
  );
}
