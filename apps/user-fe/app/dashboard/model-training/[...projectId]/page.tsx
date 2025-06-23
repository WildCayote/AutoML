"use client";

import { Brain, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useRef, useCallback, use } from "react";
import { useAppDispatch, useAppSelector } from "@/libb/hooks";
import { fetchDatasetIdByProjectId } from "@/libb/features/data/dataActions";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ProjectHeader } from "@/components/dashboard/project-header";

const API_BASE_URL = "http://ec2-34-239-157-156.compute-1.amazonaws.com:3001";
const POLLING_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY_PREFIX = "modelTraining_";
const MAX_RETRIES = 3;

interface TrainingResult {
  dataset?: {
    targetColumnName: string;
    projectId: string;
  };
  models?: Array<{
    id: string;
    name: string;
    description: string;
    projectId: string;
    model: string;
    trainingType: string;
    training_metadata: {
      best_model_info: {
        model_name: string;
        model_uuid: string;
        saved_model_path: string;
        best_hyperparameters: Record<string, any>;
        test_set_performance: {
          accuracy: number;
          weighted_f1_score: number;
          full_classification_report: Record<string, any>;
        };
      };
      all_models_performance: Array<{
        model_name: string;
        best_hyperparameters: Record<string, any>;
        test_set_performance: {
          accuracy: number;
          weighted_f1_score: number;
          full_classification_report: Record<string, any>;
        };
        cross_validation_f1_score: number;
      }>;
    };
    modelHyperParameters?: Array<{
      id: string;
      modelId: string;
      metricName: string;
      metricValue: string;
      createdAt: string;
      updatedAt: string;
    }>;
    modelPerformances?: Array<{
      id: string;
      modelId: string;
      metricName: string;
      metricValue: string;
      createdAt: string;
      updatedAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
  message?: string;
  error?: string;
}

interface TrainingState {
  data?: TrainingResult;
  error?: string;
  timestamp?: number;
}

type PageParams = {
  projectId: string[];
};

export default function ModelTrainingCard({ params }: { params: Promise<PageParams> }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    projects,
    status: projectStatus,
    error: projectError,
  } = useAppSelector((state) => state.project);
  const { access_token } = useAppSelector((state) => state.auth);


  


  const unwrappedParams = use(params);
  // const project = projects.find((p) => p.id === unwrappedParams.projectId.join("/"));
  const project = projects.find(
    (p) => p.id === unwrappedParams.projectId.join("/")
  );
  const projectId = unwrappedParams.projectId.join("/");

  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [trainingData, setTrainingData] = useState<TrainingState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDataset, setIsFetchingDataset] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = datasetId ? `${STORAGE_KEY_PREFIX}${datasetId}` : null;

  const ModelTrainingService = {
    setTrainingType: (datasetId: string) =>
      axios.post(`${API_BASE_URL}/training/${datasetId}/set-training-type`, {
        trainingType: "CLASSICAL"
      }, {
        headers: { Authorization: `Bearer ${access_token}` }
      }),
    startTraining: (datasetId: string) =>
      axios.patch(`${API_BASE_URL}/training/${datasetId}/start-classical-training`, {}, {
        headers: { Authorization: `Bearer ${access_token}` }
      }),
    getStatus: (datasetId: string) =>
      axios.get<TrainingResult>(`${API_BASE_URL}/training/${datasetId}/classical-training-results`, {
        headers: { Authorization: `Bearer ${access_token}` }
      })
  };


  const hasCompletedModel = trainingData.data?.models?.length > 0;
  const hasError = !!trainingData.error;
  const isStartButtonDisabled = isLoading || isFetchingDataset || !datasetId || hasCompletedModel;

  const renderClassificationReport = (report: Record<string, any>) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Precision</th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recall</th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">F1-Score</th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Support</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(report).map(([key, value]) => {
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return (
                  <tr key={key} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-2 px-4 text-sm font-medium text-gray-900">{key === "accuracy" ? "Accuracy" : 
                       key === "macro avg" ? "Macro Avg" : 
                       key === "weighted avg" ? "Weighted Avg" : key}</td>
                    <td className="py-2 px-4 text-sm text-gray-700">{value.precision?.toFixed(4) || '-'}</td>
                    <td className="py-2 px-4 text-sm text-gray-700">{value.recall?.toFixed(4) || '-'}</td>
                    <td className="py-2 px-4 text-sm text-gray-700">{value['f1-score']?.toFixed(4) || '-'}</td>
                    <td className="py-2 px-4 text-sm text-gray-700">{value.support || '-'}</td>
                  </tr>
                );
              }
              return null;
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    if (isFetchingDataset) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
          <div className="animate-pulse rounded-full bg-gray-200 h-10 w-10 mb-4" />
          <p className="text-sm text-gray-500">Loading dataset information...</p>
        </div>
      );
    } else if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4" />
          <p className="text-sm font-medium text-gray-700 mb-1">Training in progress</p>
          <p className="text-xs text-gray-500">This may take several minutes</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '45%' }}></div>
          </div>
        </div>
      );
    } else if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 text-red-600 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-red-600 mb-4 text-center">{trainingData.error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={startTraining}
            disabled={isLoading || isFetchingDataset}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            Retry Training
          </Button>
        </div>
      );
    } else if (hasCompletedModel) {
      const bestModel = trainingData.data?.models?.[0];
      const bestModelInfo = bestModel?.training_metadata?.best_model_info;
      const allModelsPerformance = bestModel?.training_metadata?.all_models_performance || [];
      const datasetInfo = trainingData.data?.dataset;
      const hyperParameters = bestModel?.modelHyperParameters;
      const modelPerformance = bestModel?.modelPerformances;

  return (
  <div className="space-y-8">
    {/* Dataset Information */}
    <div className="bg-white shadow rounded-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Dataset Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <p className="font-medium text-gray-600">Target Column</p>
          <p>{datasetInfo?.targetColumnName || 'N/A'}</p>
        </div>
        <div>
          <p className="font-medium text-gray-600">Project ID</p>
          <p className="break-all">{datasetInfo?.projectId || 'N/A'}</p>
        </div>
      </div>
    </div>

    {/* Best Model Information */}
    <div className="bg-white shadow rounded-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Best Model</h3>
      {bestModel ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-800">
          <div className="bg-gray-50 border p-4 rounded">
            <p className="text-gray-600 text-xs">Model Name</p>
            <p className="font-semibold text-blue-700">{bestModel.name}</p>
          </div>
          <div className="bg-gray-50 border p-4 rounded">
            <p className="text-gray-600 text-xs">Model UUID</p>
            <p className="break-all">{bestModel.id}</p>
          </div>
          <div className="bg-gray-50 border p-4 rounded">
            <p className="text-gray-600 text-xs">Training Type</p>
            <p>{bestModel.trainingType}</p>
          </div>
          <div className="md:col-span-2 lg:col-span-3 bg-gray-50 border p-4 rounded">
            <p className="text-gray-600 text-xs">Description</p>
            <p>{bestModel.description}</p>
          </div>
          <div className="bg-gray-50 border p-4 rounded">
            <p className="text-gray-600 text-xs">Model File</p>
            <a
              href={bestModel.model}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Download Model
            </a>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No best model found.</p>
      )}
    </div>

    {/* Hyperparameters */}
    <div className="bg-white shadow rounded-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Model Hyperparameters</h3>
      {hyperParameters?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
          {hyperParameters.map(param => (
            <div key={param.id} className="bg-gray-50 p-3 rounded border">
              <p className="text-gray-600 font-medium">{param.metricName}</p>
              <p className="text-gray-800">{param.metricValue}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No hyperparameters available.</p>
      )}
    </div>

    {/* Model Performance */}
    <div className="bg-white shadow rounded-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Model Performance</h3>
      {modelPerformance?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
          {modelPerformance.map(metric => (
            <div key={metric.id} className="bg-gray-50 p-3 rounded border">
              <p className="text-gray-600 font-medium">{metric.metricName}</p>
              <p className="text-gray-800">
                {(() => {
                  const val = Number(metric.metricValue);
                  if (!isNaN(val) && val >= 0 && val <= 1) return `${(val * 100).toFixed(2)}%`;
                  return metric.metricValue;
                })()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No performance metrics available.</p>
      )}
    </div>
  </div>
);


    } else {
      return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
          <Brain className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 text-center mb-4">
            No model training results available
          </p>
        </div>
      );
    }
  };

  const saveToLocalStorage = useCallback((data: TrainingState) => {
    if (!storageKey || !data.data?.models?.length) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        data: data.data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error("[STORAGE] Failed to save to localStorage", e);
    }
  }, [storageKey]);

  const loadFromLocalStorage = useCallback(() => {
    if (!storageKey) return null;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      if (parsed.data && Array.isArray(parsed.data.models) && parsed.data.models.length >= 1) {
        if (parsed.timestamp && Date.now() - parsed.timestamp > 86400000) {
          return null;
        }
        return { data: parsed.data, error: undefined, timestamp: parsed.timestamp } as TrainingState;
      }
      return null;
    } catch (e) {
      console.error("[STORAGE] Failed to load from localStorage", e);
      return null;
    }
  }, [storageKey]);

  const clearLocalStorage = useCallback(() => {
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error("[STORAGE] Failed to clear localStorage", e);
    }
  }, [storageKey]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const fetchTrainingStatus = useCallback(async () => {
    if (!datasetId) {
      setTrainingData({ error: "No datasetId available for status fetch." });
      setIsLoading(false);
      stopPolling();
      return;
    }

    try {
      const response = await ModelTrainingService.getStatus(datasetId);
      const apiData = response.data;
      const hasModelData = Array.isArray(apiData.models) && apiData.models.length >= 1;

      if (hasModelData) {
        const completedState: TrainingState = { data: apiData, error: undefined };
        setTrainingData(completedState);
        saveToLocalStorage(completedState);
        stopPolling();
        setIsLoading(false);
        setRetryCount(0);
      } else if (apiData.message?.includes("failed") || apiData.error) {
        const errMsg = apiData.error || apiData.message || "Training failed without specific error message.";
        setTrainingData({ error: errMsg });
        stopPolling();
        setIsLoading(false);
        setRetryCount(0);
      } else {
        setTrainingData({ data: apiData, error: undefined });
        setRetryCount(0);
      }
    } catch (err) {
      const errorMsg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : String(err);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(fetchTrainingStatus, 5000);
      } else {
        setTrainingData({ error: `Failed to fetch training status after multiple attempts: ${errorMsg}` });
        stopPolling();
        setIsLoading(false);
        setRetryCount(0);
      }
    }
  }, [datasetId, stopPolling, saveToLocalStorage, retryCount]);

  const startPolling = useCallback(() => {
    if (!pollingIntervalRef.current && !(trainingData.data?.models?.length)) {
      pollingIntervalRef.current = setInterval(fetchTrainingStatus, POLLING_INTERVAL);
      fetchTrainingStatus();
    }
  }, [fetchTrainingStatus, trainingData.data?.models]);

  const startTraining = useCallback(async () => {
    if (!datasetId) {
      setTrainingData({ error: "No datasetId to start training." });
      setIsLoading(false);
      return;
    }

    setTrainingData({});
    clearLocalStorage();
    stopPolling();
    setIsLoading(true);
    setRetryCount(0);

    try {
      await ModelTrainingService.setTrainingType(datasetId);
      await ModelTrainingService.startTraining(datasetId);
      startPolling();
    } catch (err) {
      const errorMsg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : String(err);
      setTrainingData({ error: `Failed to initiate training: ${errorMsg}` });
      setIsLoading(false);
    }
  }, [datasetId, startPolling, stopPolling, clearLocalStorage]);
    useEffect(() => {
    if (!projectId) return;

    const fetchId = async () => {
      setIsFetchingDataset(true);
      try {
        const id = await dispatch(fetchDatasetIdByProjectId(projectId)).unwrap();
        if (id) {
          setDatasetId(id);
        } else {
          setTrainingData({ error: "No datasetId found for project." });
          setIsLoading(false);
        }
      } catch (err) {
        setTrainingData({ error: `Failed to load dataset information: ${axios.isAxiosError(err) ? err.message : String(err)}` });
        setIsLoading(false);
      } finally {
        setIsFetchingDataset(false);
      }
    };

    fetchId();
  }, [projectId, dispatch]);

  useEffect(() => {
    if (!datasetId) return;

    const storedData = loadFromLocalStorage();
    if (storedData) {
      setTrainingData(storedData);
      setIsLoading(false);
    } else {
      setTrainingData({});
      setIsLoading(false);
    }
  }, [datasetId, loadFromLocalStorage]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return (
    <>
    <ProjectHeader projectId={project?.id ?? " "} />
    <div className="p-8">
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Brain className="h-5 w-5 text-blue-600 mr-2" />
              Model Training
            </CardTitle>
            <CardDescription>
              {isLoading ? "Training in progress..." : "Train machine learning models"}
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={startTraining}
            disabled={isStartButtonDisabled}
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            {isLoading ? "Training..." : "Start Training"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
    </div>
    </>
  );
}