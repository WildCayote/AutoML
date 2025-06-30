// hooks/fetchEDA.ts
import { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/libb/hooks';
import { fetchDatasetIdByProjectId, fetchEDAByDatasetId } from '@/libb/features/data/dataActions';

export function fetchEDA(projectId: string) {
  const dispatch = useAppDispatch();
  const { datasets, status } = useAppSelector((state) => state.data);
  const dataset = datasets.length > 0 ? datasets[0] : null;
  const [timeoutReached, setTimeoutReached] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [isPolling, setIsPolling] = useState(false);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsPolling(false);
  }, []);

  const startPolling = useCallback((datasetId: string) => {
    setIsPolling(true);
    setTimeoutReached(false);

    timeoutRef.current = setTimeout(() => {
      setTimeoutReached(true);
      stopPolling();
    }, 180000);

    const poll = async () => {
      const result = await dispatch(fetchEDAByDatasetId(datasetId)).unwrap();
      if (result?.edaReport?.url) {
        stopPolling();
      }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 10000);
  }, [dispatch, stopPolling]);

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    try {
      const datasetId = await dispatch(fetchDatasetIdByProjectId(projectId)).unwrap();
      if (!datasetId) return;

      const initial = await dispatch(fetchEDAByDatasetId(datasetId)).unwrap();
      if (initial?.edaReport?.url) {
        stopPolling();
      } else {
        startPolling(datasetId);
      }
    } catch (error) {
      console.error("Failed to fetch dataset ID or EDA:", error);
    }
  }, [projectId, dispatch, startPolling, stopPolling]);

  return {
    dataset,
    isLoading: status === 'loading',
    error: timeoutReached 
      ? 'EDA generation timed out after 3 minutes' 
      : status === 'failed' ? 'Failed to load dataset' : null,
    isPolling,
    fetchData,
    stopPolling
  };
}
