"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/libb/hooks";
import { startFeatureEngineering, fetchFeatureEngineeringResults } from '@/libb/features/data/dataActions';

export function useFeatureEngineering(datasetId: string) {
  const dispatch = useAppDispatch();
  const { datasets, featureEngStatus } = useAppSelector((state) => state.data);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dataset = datasets.find(d => d.id === datasetId) || null;
  const featureEngDone = Boolean(dataset?.featureEngArtifacts);

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
    dispatch(fetchFeatureEngineeringResults(datasetId));
    pollIntervalRef.current = setInterval(() => {
      dispatch(fetchFeatureEngineeringResults(datasetId));
    }, 10000);
  }, [datasetId, dispatch, stopPolling]);

  const startFeatureEng = useCallback(async () => {
    setTimeoutReached(false);
    await dispatch(startFeatureEngineering(datasetId));
  }, [datasetId, dispatch]);

  const fetchEngResults = useCallback(() => {
    setTimeoutReached(false);
    startPolling();
  }, [startPolling]);

  useEffect(() => {
    if (featureEngDone) {
      stopPolling();
    }
  }, [featureEngDone, stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    results: dataset?.featureEngArtifacts,
    isLoading: featureEngStatus === "loading",
    error: timeoutReached 
      ? 'Feature engineering timed out after 3 minutes' 
      : featureEngStatus === 'failed' ? 'Failed to fetch results' : null,
    startFeatureEng,
    fetchEngResults,
    stopPolling
  };
}