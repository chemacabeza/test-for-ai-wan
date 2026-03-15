import { useState, useEffect, useCallback } from 'react';
import { getAllJobs } from '../services/api';

/**
 * Hook that fetches all jobs and automatically polls for updates
 * while any job is in an active state.
 */
export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await getAllJobs();
      setJobs(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Poll while any job is active
  useEffect(() => {
    const hasActive = jobs.some((j) =>
      ['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(j.status)
    );
    if (!hasActive) return;

    const interval = setInterval(fetchJobs, 10000); // 10s
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
}
