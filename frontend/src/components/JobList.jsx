import React from 'react';
import JobCard from './JobCard';
import { useJobs } from '../hooks/useJobs';

export default function JobList({ pendingJobs }) {
  const { jobs, loading, error, refetch, cancelJob, deleteJob } = useJobs();

  // Merge optimistically-added pending jobs (from form submission) with server list.
  // Exclude CANCELLED jobs so they disappear from the gallery immediately.
  const allJobs = React.useMemo(() => {
    const serverIds = new Set(jobs.map((j) => j.id));
    const optimistic = pendingJobs.filter((j) => !serverIds.has(j.id));
    return [...optimistic, ...jobs].filter((j) => j.status !== 'CANCELLED');
  }, [jobs, pendingJobs]);

  const activeCount = allJobs.filter((j) =>
    ['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(j.status)
  ).length;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          🎥 Generated Videos
          {allJobs.length > 0 && (
            <span style={{
              fontSize: '0.8rem', fontWeight: 600,
              background: 'rgba(99,120,255,0.15)',
              color: 'var(--accent-1)',
              borderRadius: '100px',
              padding: '2px 10px',
            }}>
              {allJobs.length}
            </span>
          )}
          {activeCount > 0 && (
            <span style={{
              fontSize: '0.78rem', fontWeight: 500,
              color: '#fbbf24',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <span className="pulse" style={{ background: '#fbbf24' }} />
              {activeCount} processing
            </span>
          )}
        </h2>
        <button
          onClick={refetch}
          className="btn btn-secondary btn-sm"
          title="Refresh"
          style={{ minWidth: '36px', padding: '8px' }}
        >
          ↻
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ Could not load jobs: {error}
        </div>
      )}

      {loading && allJobs.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : allJobs.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🎬</span>
          <h3 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>No videos yet</h3>
          <p>Submit a generation request above to get started.</p>
        </div>
      ) : (
        <div className="job-grid">
          {allJobs.map((job) => (
            <JobCard key={job.id} job={job} onCancel={cancelJob} onDelete={deleteJob} />
          ))}
        </div>
      )}
    </section>
  );
}
