"use client";

import { WandIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAppDispatch } from "@/libb/hooks";
import { fetchDatasetIdByProjectId } from "@/libb/features/data/dataActions";
import axios from "axios";

const API_BASE_URL = "http://ec2-3-239-98-228.compute-1.amazonaws.com:3001";
const POLLING_INTERVAL = 10000;
const STORAGE_KEY_PREFIX = "featureSelection_";

interface FeatureSelectionResult {
  FeaturesVizFile: string;
  featureSelectionStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
}

export function FeatureSelectionCard({ projectId }: { projectId: string | null }) {
  const dispatch = useAppDispatch();
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [results, setResults] = useState<FeatureSelectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = datasetId ? `${STORAGE_KEY_PREFIX}${datasetId}` : null;

  const saveToLocalStorage = useCallback((data: FeatureSelectionResult) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [storageKey]);

  const loadFromLocalStorage = useCallback(() => {
    if (!storageKey) return null;
    try {
      const storedData = localStorage.getItem(storageKey);
      return storedData ? JSON.parse(storedData) as FeatureSelectionResult : null;
    } catch (e) {
      console.error("Failed to load from localStorage", e);
      return null;
    }
  }, [storageKey]);

  const clearLocalStorage = useCallback(() => {
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error("Failed to clear localStorage", e);
    }
  }, [storageKey]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const fetchFeatureSelectionStatus = useCallback(async () => {
    if (!datasetId) {
      stopPolling();
      return;
    }

    try {
      const response = await axios.get<FeatureSelectionResult>(
        `${API_BASE_URL}/datasets/${datasetId}/feature-selection`
      );

      const status = response.data.featureSelectionStatus;
      setResults(response.data);
      saveToLocalStorage(response.data);

      if (status === "COMPLETED" || status === "FAILED") {
        stopPolling();
        setIsLoading(false);
        if (status === "FAILED") setError("Feature selection failed.");
      }
    } catch (err) {
      console.error("Status fetch failed", err);
      stopPolling();
      setError("Failed to fetch feature selection status");
      setIsLoading(false);
    }
  }, [datasetId, stopPolling, saveToLocalStorage]);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    pollingIntervalRef.current = setInterval(fetchFeatureSelectionStatus, POLLING_INTERVAL);
  }, [fetchFeatureSelectionStatus]);

  const startFeatureSelection = useCallback(async () => {
    if (!datasetId) {
      setError("No datasetId");
      return;
    }

    setIsLoading(true);
    setError(null);
    stopPolling();

    try {
      const statusResponse = await axios.get<FeatureSelectionResult>(
        `${API_BASE_URL}/datasets/${datasetId}/feature-selection`
      );

      const currentStatus = statusResponse.data.featureSelectionStatus;

      if (currentStatus === "COMPLETED") {
        const cached = loadFromLocalStorage();
        if (cached) {
          setResults(cached);
        } else {
          setResults(statusResponse.data);
          saveToLocalStorage(statusResponse.data);
        }
        setIsLoading(false);
        return;
      }

      if (currentStatus === "IN_PROGRESS") {
        setResults(statusResponse.data);
        saveToLocalStorage(statusResponse.data);
        startPolling();
        return;
      }

      // Not started or failed — start new process
      clearLocalStorage();
      await axios.patch(`${API_BASE_URL}/datasets/${datasetId}/start-feature-selection`);
      const freshStatus = await axios.get<FeatureSelectionResult>(
        `${API_BASE_URL}/datasets/${datasetId}/feature-selection`
      );

      setResults(freshStatus.data);
      saveToLocalStorage(freshStatus.data);

      if (freshStatus.data.featureSelectionStatus === "IN_PROGRESS") {
        startPolling();
      } else if (freshStatus.data.featureSelectionStatus === "FAILED") {
        setError("Feature selection process failed");
      }

    } catch (err) {
      console.error("Start failed", err);
      setError("Failed to start feature selection");
    } finally {
      setIsLoading(false);
    }
  }, [datasetId, loadFromLocalStorage, clearLocalStorage, saveToLocalStorage, startPolling, stopPolling]);

  useEffect(() => {
    if (!projectId) return;

    const fetchId = async () => {
      try {
        const id = await dispatch(fetchDatasetIdByProjectId(projectId)).unwrap();
        if (id) setDatasetId(id);
      } catch (err) {
        console.error("Failed to fetch datasetId", err);
      }
    };

    fetchId();
  }, [projectId, dispatch]);

  useEffect(() => {
    if (!datasetId) return;

    const stored = loadFromLocalStorage();
    if (stored) {
      setResults(stored);
      if (stored.featureSelectionStatus === "IN_PROGRESS") {
        setIsLoading(true);
        startPolling();
      } else if (stored.featureSelectionStatus === "FAILED") {
        setError("Previous feature selection process failed");
      }
    }
  }, [datasetId, loadFromLocalStorage, startPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg">Feature Selection</CardTitle>
        <CardDescription>
          {isLoading ? "Processing..." : "Generate feature selection report"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center p-8">
            <div className="animate-pulse flex space-x-4 mb-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            </div>
            <p>Generating feature selection report...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <p className="text-red-500 mb-3">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={startFeatureSelection}
              disabled={isLoading}
            >
              <WandIcon className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : results?.featureSelectionStatus === "COMPLETED" && results.FeaturesVizFile ? (
          <div className="p-4 border rounded-lg">
            <iframe
              src={results.FeaturesVizFile.url}
              width="100%"
              height="500px"
              title="Feature Selection Report"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <WandIcon className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 text-center mb-4">
              {results?.featureSelectionStatus === "IN_PROGRESS"
                ? "Report generation in progress..."
                : "No feature selection report available"}
            </p>
          </div>
        )}

        <div className="flex space-x-3 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={startFeatureSelection}
            disabled={isLoading || !datasetId || results?.featureSelectionStatus === "IN_PROGRESS"}
          >
            <WandIcon className="h-4 w-4 mr-2" />
            {isLoading ? "Processing..." : "Generate Report"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
