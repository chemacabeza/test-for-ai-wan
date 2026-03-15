import React, { useState } from 'react';
import Header from './components/Header';
import TextToVideoForm from './components/TextToVideoForm';
import ImageToVideoForm from './components/ImageToVideoForm';
import JobList from './components/JobList';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('t2v');
  const [pendingJobs, setPendingJobs] = useState([]);

  const handleJobCreated = (job) => {
    setPendingJobs((prev) => [job, ...prev]);
    // Scroll to results
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  return (
    <>
      <Header />

      <main className="container page">
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '48px', padding: '0 16px' }}>
          <h1 style={{
            background: 'linear-gradient(135deg, #e8ecff 0%, #6378ff 50%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '12px',
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
          }}>
            AI Video Generation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto' }}>
            Create stunning cinematic videos from text prompts or images using
            Wan 2.6 — Alibaba's most powerful video AI model.
          </p>
        </div>

        {/* Generation Panel */}
        <div className="glass-card" style={{ padding: '28px', marginBottom: '48px' }}>
          <div className="tab-bar">
            <button
              id="tab-t2v"
              className={`tab-btn ${activeTab === 't2v' ? 'active' : ''}`}
              onClick={() => setActiveTab('t2v')}
            >
              📝 Text to Video
            </button>
            <button
              id="tab-i2v"
              className={`tab-btn ${activeTab === 'i2v' ? 'active' : ''}`}
              onClick={() => setActiveTab('i2v')}
            >
              🖼️ Image to Video
            </button>
          </div>

          {activeTab === 't2v' ? (
            <TextToVideoForm onJobCreated={handleJobCreated} />
          ) : (
            <ImageToVideoForm onJobCreated={handleJobCreated} />
          )}
        </div>

        {/* Gallery */}
        <div id="results">
          <JobList pendingJobs={pendingJobs} />
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
      }}>
        Wan 2.6 Studio · Powered by{' '}
        <a href="https://fal.ai" target="_blank" rel="noreferrer">fal.ai</a>
        {' '}· Spring Boot + React
      </footer>
    </>
  );
}
