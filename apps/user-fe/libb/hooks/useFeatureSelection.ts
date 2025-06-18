"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/libb/hooks";
import { startFeatureSelection, fetchFeatureSelectionResults } from '@/libb/features/data/dataActions';

export function useFeatureSelection(datasetId: string) {
  const dispatch = useAppDispatch();
  const { datasets, featureSelStatus } = useAppSelector((state) => state.data);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dataset = datasets.find(d => d.id === datasetId) || null;
  const featureSelDone = Boolean(dataset?.featureSelection);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pollIntervalRef.current = null;
    timeoutRef.current = null;
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();

    // 3 minutes timeout
    timeoutRef.current = setTimeout(() => {
      setTimeoutReached(true);
      stopPolling();
    }, 180000);

    // Immediate fetch and then every 10 seconds
    dispatch(fetchFeatureSelectionResults(datasetId));
    pollIntervalRef.current = setInterval(() => {
      dispatch(fetchFeatureSelectionResults(datasetId));
    }, 10000);
  }, [datasetId, dispatch, stopPolling]);

  const startFeatureSel = useCallback(async () => {
    setTimeoutReached(false);
    await dispatch(startFeatureSelection(datasetId));
  }, [datasetId, dispatch]);

  const fetchSelResults = useCallback(() => {
    setTimeoutReached(false);
    startPolling();
  }, [startPolling]);

  useEffect(() => {
    if (featureSelDone) {
      stopPolling();
    }
  }, [featureSelDone, stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    selResults: dataset?.featureSelection,
    isSelLoading: featureSelStatus === "loading",
    selError: timeoutReached 
      ? 'Feature selection timed out after 3 minutes' 
      : featureSelStatus === 'failed' ? 'Failed to fetch results' : null,
    startFeatureSel,
    fetchSelResults,
    stopPolling
  };
}