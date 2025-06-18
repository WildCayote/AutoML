"use client";

import { WandIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAppDispatch } from "@/libb/hooks";
import { fetchDatasetIdByProjectId } from "@/libb/features/data/dataActions";
import axios from "axios";

const API_BASE_URL = "http://ec2-34-239-157-156.compute-1.amazonaws.com:3001";
const POLLING_INTERVAL = 10000; // 10 seconds
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

  // Generate storage key based on datasetId
  const storageKey = datasetId ? `${STORAGE_KEY_PREFIX}${datasetId}` : null;

  console.log(`[RENDER] projectId: ${projectId}, datasetId: ${datasetId}, status: ${results?.featureEngineeringStatus}, loading: ${isLoading}, error: ${error}`);

  // --- Persistence Functions ---
  const saveToLocalStorage = useCallback((data: FeatureEngineeringResult) => {
    if (!storageKey) return;
    try {
      console.log(`[STORAGE] Saving to localStorage with key: ${storageKey}`);
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.error("[STORAGE] Failed to save to localStorage", e);
    }
  }, [storageKey]);

  const loadFromLocalStorage = useCallback(() => {
    if (!storageKey) return null;
    try {
      console.log(`[STORAGE] Loading from localStorage with key: ${storageKey}`);
      const storedData = localStorage.getItem(storageKey);
      return storedData ? JSON.parse(storedData) as FeatureEngineeringResult : null;
    } catch (e) {
      console.error("[STORAGE] Failed to load from localStorage", e);
      return null;
    }
  }, [storageKey]);

  const clearLocalStorage = useCallback(() => {
    if (!storageKey) return;
    try {
      console.log(`[STORAGE] Clearing localStorage for key: ${storageKey}`);
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error("[STORAGE] Failed to clear localStorage", e);
    }
  }, [storageKey]);

  // --- Polling Control ---
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log("[POLLING] Stopping polling interval");
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // --- API Operations ---
  const fetchFeatureEngineeringStatus = useCallback(async () => {
    console.log("[STATUS] Fetching feature engineering status...");
    if (!datasetId) {
      const errMsg = "[STATUS] Cannot fetch - no datasetId available";
      console.error(errMsg);
      setError(errMsg);
      stopPolling();
      setIsLoading(false);
      return;
    }

    try {
      console.log(`[API] GET ${API_BASE_URL}/datasets/${datasetId}/feature-engineering`);
      const response = await axios.get<FeatureEngineeringResult>(
        `${API_BASE_URL}/datasets/${datasetId}/feature-engineering`
      );
      
      console.log(`[STATUS] Received status: ${response.data.featureEngineeringStatus}`);
      setResults(response.data);
      saveToLocalStorage(response.data);

      switch(response.data.featureEngineeringStatus) {
        case "COMPLETED":
          console.log("[STATUS] Process completed successfully!");
          stopPolling();
          setIsLoading(false);
          break;
        case "FAILED":
          console.error("[STATUS] Process failed");
          stopPolling();
          setIsLoading(false);
          setError("Feature engineering process failed");
          break;
        case "IN_PROGRESS":
          console.log("[STATUS] Process still in progress...");
          break;
        default:
          console.log("[STATUS] Process not started yet");
      }
    } catch (err) {
      const errMsg = `[ERROR] Status fetch failed: ${err.message}`;
      console.error(errMsg, err);
      stopPolling();
      setIsLoading(false);
      setError("Failed to fetch feature engineering status");
    }
  }, [datasetId, stopPolling, saveToLocalStorage]);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log("[POLLING] Polling already active - skipping");
      return;
    }
    console.log(`[POLLING] Starting polling every ${POLLING_INTERVAL/1000}s`);
    pollingIntervalRef.current = setInterval(fetchFeatureEngineeringStatus, POLLING_INTERVAL);
  }, [fetchFeatureEngineeringStatus]);

  const startFeatureEngineering = useCallback(async () => {
    console.log("[ACTION] Starting feature engineering process...");
    if (!datasetId) {
      const errMsg = "[ERROR] Cannot start - no datasetId";
      console.error(errMsg);
      setError(errMsg);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    clearLocalStorage();
    stopPolling();

    try {
      console.log(`[API] PATCH ${API_BASE_URL}/datasets/${datasetId}/start-feature-engineering`);
      await axios.patch(`${API_BASE_URL}/datasets/${datasetId}/start-feature-engineering`);
      console.log("[ACTION] Process started successfully");
      
      // Initial immediate status check
      console.log("[STATUS] Performing initial status check");
      const statusResponse = await axios.get<FeatureEngineeringResult>(
        `${API_BASE_URL}/datasets/${datasetId}/feature-engineering`
      );
      
      console.log(`[STATUS] Received status: ${statusResponse.data.featureEngineeringStatus}`);
      setResults(statusResponse.data);
      saveToLocalStorage(statusResponse.data);

      // Start polling based on the fresh response
      if (statusResponse.data.featureEngineeringStatus === "IN_PROGRESS") {
        console.log("[POLLING] Starting polling for IN_PROGRESS status");
        startPolling();
      }
    } catch (err) {
      const errMsg = `[ERROR] Process start failed: ${err.message}`;
      console.error(errMsg, err);
      setError("Failed to start feature engineering");
      setIsLoading(false);
    }
  }, [datasetId, startPolling, stopPolling, clearLocalStorage, saveToLocalStorage]);

  // --- Dataset ID Management ---
  useEffect(() => {
    console.log("[EFFECT] Checking for projectId...");
    if (!projectId) {
      console.log("[EFFECT] No projectId - skipping datasetId fetch");
      return;
    }

    const fetchId = async () => {
      try {
        console.log(`[DATASET] Fetching datasetId for project: ${projectId}`);
        const id = await dispatch(fetchDatasetIdByProjectId(projectId)).unwrap();
        if (id) {
          console.log(`[DATASET] Received datasetId: ${id}`);
          setDatasetId(id);
        } else {
          console.error("[DATASET] No datasetId returned");
        }
      } catch (err) {
        console.error(`[ERROR] Dataset ID fetch failed: ${err.message}`);
      }
    };
    
    fetchId();
  }, [projectId, dispatch]);

  // --- Load Persisted Data ---
  useEffect(() => {
    if (!datasetId) return;

    const storedData = loadFromLocalStorage();
    if (storedData) {
      console.log(`[STORAGE] Loaded stored data:`, storedData);
      setResults(storedData);

      if (storedData.featureEngineeringStatus === "IN_PROGRESS") {
        console.log("[STORAGE] Resuming polling for IN_PROGRESS status");
        setIsLoading(true);
        startPolling();
      } else if (storedData.featureEngineeringStatus === "COMPLETED") {
        console.log("[STORAGE] Found completed process");
      } else if (storedData.featureEngineeringStatus === "FAILED") {
        console.log("[STORAGE] Found failed process");
        setError("Previous feature engineering process failed");
      }
    }
  }, [datasetId, loadFromLocalStorage, startPolling]);

  // --- Cleanup ---
  useEffect(() => {
    return () => {
      console.log("[CLEANUP] Component unmounting - stopping polling");
      stopPolling();
    };
  }, [stopPolling]);

  // --- UI Rendering ---
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