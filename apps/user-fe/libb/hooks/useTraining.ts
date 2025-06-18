import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/libb/hooks";
import { 
  startClassicalTraining, 
  fetchClassicalTrainingResults,
  setTrainingType,
  getTrainingType
} from "@/libb/features/training/trainingActions";
import { stopPolling } from "@/libb/features/training/trainingSlice";

export function useTraining(datasetId: string) {
  const dispatch = useAppDispatch();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Select training state for this dataset
  const {
    classicalResults,
    trainingType,
    loading,
    error,
    isPolling,
    lastUpdated
  } = useAppSelector((state) => state.training.datasets[datasetId] || {
    classicalResults: null,
    trainingType: null,
    loading: false,
    error: null,
    isPolling: false,
    lastUpdated: null
  });

  const stopTrainingPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    dispatch(stopPolling({ datasetId }));
  }, [datasetId, dispatch]);

  const startTrainingPolling = useCallback(() => {
    stopTrainingPolling();
    // Initial fetch
    dispatch(fetchClassicalTrainingResults(datasetId));
    // Start polling every 10 seconds
    pollIntervalRef.current = setInterval(() => {
      dispatch(fetchClassicalTrainingResults(datasetId));
    }, 10000);
  }, [datasetId, dispatch, stopTrainingPolling]);

  const startTraining = useCallback(async () => {
    const result = await dispatch(startClassicalTraining(datasetId));
    if (startClassicalTraining.fulfilled.match(result)) {
      startTrainingPolling();
    }
  }, [datasetId, dispatch, startTrainingPolling]);

  const setTraining = useCallback(async (type: string) => {
    await dispatch(setTrainingType({ datasetId, trainingType: type }));
  }, [datasetId, dispatch]);

  const getCurrentTrainingType = useCallback(async () => {
    await dispatch(getTrainingType(datasetId));
  }, [datasetId, dispatch]);

  useEffect(() => {
    // Initialize training type if not set
    if (!trainingType) {
      getCurrentTrainingType();
    }
  }, [trainingType, getCurrentTrainingType]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopTrainingPolling();
    };
  }, [stopTrainingPolling]);

  useEffect(() => {
    // Start/stop polling based on isPolling state
    if (isPolling && !pollIntervalRef.current) {
      startTrainingPolling();
    } else if (!isPolling && pollIntervalRef.current) {
      stopTrainingPolling();
    }
  }, [isPolling, startTrainingPolling, stopTrainingPolling]);

  return {
    classicalResults,
    trainingType,
    isLoading: loading,
    error,
    isPolling,
    lastUpdated,
    startTraining,
    setTraining,
    stopTrainingPolling,
    refreshResults: () => dispatch(fetchClassicalTrainingResults(datasetId))
  };
}