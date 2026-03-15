import { useState, useEffect, useCallback } from 'react';
import { getAllJobs, cancelJob as cancelJobApi, deleteJob as deleteJobApi } from '../services/api';

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

  // Cancel a job: optimistic update then refetch
  const cancelJob = useCallback(async (jobId) => {
    // Optimistic: immediately show CANCELLED in the UI
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, status: 'CANCELLED', errorMessage: 'Cancelled by user' }
          : j
      )
    );
    await cancelJobApi(jobId);
    // Sync with server state
    await fetchJobs();
  }, [fetchJobs]);

  // Delete a job (FAILED/CANCELLED only): optimistic removal then refetch
  const deleteJob = useCallback(async (jobId) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    await deleteJobApi(jobId);
    await fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs, cancelJob, deleteJob };
}

