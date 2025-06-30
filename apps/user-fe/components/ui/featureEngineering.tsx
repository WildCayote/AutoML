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
const STORAGE_KEY_PREFIX = "featureEngineering_";

interface FeatureEngineeringResult {
  featureEngineeringVizFile: string;
  featureEngineeringStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
}

export function FeatureEngineeringCard({ projectId }: { projectId: string | null }) {
  const dispatch = useAppDispatch();
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [results, setResults] = useState<FeatureEngineeringResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = datasetId ? `${STORAGE_KEY_PREFIX}${datasetId}` : null;

  const saveToLocalStorage = useCallback((data: FeatureEngineeringResult) => {
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
      return storedData ? JSON.parse(storedData) as FeatureEngineeringResult : null;
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

  const fetchFeatureEngineeringStatus = useCallback(async () => {
    if (!datasetId) {
      stopPolling();
      return;
    }

    try {
      const response = await axios.get<FeatureEngineeringResult>(
        `${API_BASE_URL}/datasets/${datasetId}/feature-engineering`
      );

      const status = response.data.featureEngineeringStatus;
      setResults(response.data);
      saveToLocalStorage(response.data);

      if (status === "COMPLETED" || status === "FAILED") {
        stopPolling();
        setIsLoading(false);
        if (status === "FAILED") setError("Feature engineering failed.");
      }
    } catch (err) {
      console.error("Status fetch failed", err);
      stopPolling();
      setError("Failed to fetch feature engineering status");
      setIsLoading(false);
    }
  }, [datasetId, stopPolling, saveToLocalStorage]);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    pollingIntervalRef.current = setInterval(fetchFeatureEngineeringStatus, POLLING_INTERVAL);
  }, [fetchFeatureEngineeringStatus]);

  const startFeatureEngineering = useCallback(async () => {
    if (!datasetId) {
      setError("No datasetId");
      return;
    }

    setIsLoading(true);
    setError(null);
    stopPolling();

    try {
      const statusResponse = await axios.get<FeatureEngineeringResult>(
        `${API_BASE_URL}/datasets/${datasetId}/feature-engineering`
      );

      const currentStatus = statusResponse.data.featureEngineeringStatus;

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

      clearLocalStorage();
      await axios.patch(`${API_BASE_URL}/datasets/${datasetId}/start-feature-engineering`);
      const freshStatusResponse = await axios.get<FeatureEngineeringResult>(
        `${API_BASE_URL}/datasets/${datasetId}/feature-engineering`
      );

      setResults(freshStatusResponse.data);
      saveToLocalStorage(freshStatusResponse.data);

      if (freshStatusResponse.data.featureEngineeringStatus === "IN_PROGRESS") {
        startPolling();
      } else if (freshStatusResponse.data.featureEngineeringStatus === "FAILED") {
        setError("Feature engineering process failed");
      }

    } catch (err) {
      console.error("Start failed", err);
      setError("Failed to start feature engineering");
    } finally {
      setIsLoading(false);
    }
  }, [datasetId, startPolling, stopPolling, loadFromLocalStorage, clearLocalStorage, saveToLocalStorage]);

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
      if (stored.featureEngineeringStatus === "IN_PROGRESS") {
        setIsLoading(true);
        startPolling();
      } else if (stored.featureEngineeringStatus === "FAILED") {
        setError("Previous feature engineering process failed");
      }
    }
  }, [datasetId, loadFromLocalStorage, startPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg">Feature Engineering</CardTitle>
        <CardDescription>
          {isLoading ? "Processing..." : "Generate feature engineering report"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center p-8">
            <div className="animate-pulse flex space-x-4 mb-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            </div>
            <p>Generating feature engineering report...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <p className="text-red-500 mb-3">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={startFeatureEngineering}
              disabled={isLoading}
            >
              <WandIcon className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : results?.featureEngineeringStatus === "COMPLETED" && results.featureEngineeringVizFile ? (
          <div className="p-4 border rounded-lg">
            <iframe
              src={results.featureEngineeringVizFile.url}
              width="100%"
              height="500px"
              title="Feature Engineering Report"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <WandIcon className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 text-center mb-4">
              {results?.featureEngineeringStatus === "IN_PROGRESS"
                ? "Report generation in progress..."
                : "No feature engineering report available"}
            </p>
          </div>
        )}

        <div className="flex space-x-3 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={startFeatureEngineering}
            disabled={isLoading || !datasetId || results?.featureEngineeringStatus === "IN_PROGRESS"}
          >
            <WandIcon className="h-4 w-4 mr-2" />
            {isLoading ? "Processing..." : "Generate Report"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
