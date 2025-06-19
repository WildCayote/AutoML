"use client"

import { BarChart2, Link2Icon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useRef, useState, useCallback, use } from "react"
import { ProjectHeader } from "@/components/dashboard/project-header"
import { refresh } from "@/libb/features/auth/authActions"
import { useRouter } from "next/navigation"
import { fetchEDA } from "@/libb/hooks/fetchEDA"
import { useAppDispatch, useAppSelector } from "@/libb/hooks"
import { fetchDatasetIdByProjectId } from "@/libb/features/data/dataActions"

type PageParams = {
  projectId: string[]
}

type EDACache = {
  url: string;
  timestamp: number;
  projectId: string;
}

const EDA_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export default function EDAPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.projectId.join("/");
  const initialized = useRef(false);
  
  // State for cached EDA
  const [cachedEDA, setCachedEDA] = useState<EDACache | null>(null);
  
  // Use the custom hook to fetch dataset and EDA
  const { dataset, isLoading, error, isPolling, fetchData, stopPolling } = fetchEDA(projectId);
  
  // Get project data
  const { projects, status: projectStatus, error: projectError } = useAppSelector((state) => state.project);
  const { error: authError } = useAppSelector((state) => state.auth);
  const project = projects.find((p) => p.id === projectId);

  // Load cached EDA data
  const loadCachedEDA = useCallback(() => {
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem(`eda-${projectId}`);
      if (cachedData) {
        const parsedData: EDACache = JSON.parse(cachedData);
        if (Date.now() - parsedData.timestamp < EDA_CACHE_EXPIRY) {
          setCachedEDA(parsedData);
          return true;
        }
        localStorage.removeItem(`eda-${projectId}`);
      }
    }
    return false;
  }, [projectId]);

  // Cache new EDA data
  const cacheEDA = useCallback((url: string) => {
    const edaCache: EDACache = {
      url,
      timestamp: Date.now(),
      projectId
    };
    
    localStorage.setItem(`eda-${projectId}`, JSON.stringify(edaCache));
    setCachedEDA(edaCache);
  }, [projectId]);

  // Check for cached EDA on initial load
  useEffect(() => {
    loadCachedEDA();
  }, [loadCachedEDA]);

  // Initialize polling or use cached data
  useEffect(() => {
    if (!initialized.current && projectId) {
      if (!loadCachedEDA()) {
        fetchData();
      }
      initialized.current = true;
    }
  }, [projectId, fetchData, loadCachedEDA]);

  // Cache new EDA data when it arrives
  useEffect(() => {
    if (dataset?.edaReport?.url && !isLoading && !error) {
      cacheEDA(dataset.edaReport.url);
    }
  }, [dataset?.edaReport?.url, isLoading, error, cacheEDA]);

  // Handle auth errors
  useEffect(() => {
    if (projectError === "Unauthorized") {
      dispatch(refresh());
    }
  }, [projectError, dispatch]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Handle retry
  const handleRetry = useCallback(() => {
    localStorage.removeItem(`eda-${projectId}`);
    setCachedEDA(null);
    
    dispatch(fetchDatasetIdByProjectId(projectId))
      .unwrap()
      .then((datasetId) => {
        if (datasetId) fetchData();
      });
  }, [projectId, dispatch, fetchData]);

  // Clear cache manually
  const handleClearCache = useCallback(() => {
    localStorage.removeItem(`eda-${projectId}`);
    setCachedEDA(null);
    fetchData();
  }, [fetchData, projectId]);

  if (!project) {
    return <div className="p-8">Project not found</div>;
  }

  // Get the EDA visualization data - prefer fresh data over cached
  const edaViz = dataset?.edaReport?.url || cachedEDA?.url;

  return (
    <>
      <ProjectHeader projectId={project.id} />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold">Exploratory Data Analysis</h1>
          </div>
          <Button size="sm" onClick={() => fetchData()}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Dataset Analysis</CardTitle>
            <CardDescription>
              {isLoading ? (
                <span>
                  {isPolling ? "Generating visualization (checking every 10 seconds)" : "Loading..."}
                </span>
              ) : cachedEDA ? (
                <span>Cached visualization (generated on {new Date(cachedEDA.timestamp).toLocaleString()})</span>
              ) : "Exploratory visualization of your dataset"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center p-8">
                <div className="animate-pulse flex space-x-4 mb-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                </div>
                <p>Generating EDA report...</p>
                {isPolling && (
                  <p className="text-sm text-gray-500 mt-2">
                    This may take a few minutes. We'll keep checking every 10 seconds.
                  </p>
                )}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-red-500 mb-3">{error}</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRetry}
                  >
                    Retry
                  </Button>
                  {cachedEDA && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCachedEDA(cachedEDA)}
                    >
                      Use Cached Version
                    </Button>
                  )}
                </div>
              </div>
            ) : edaViz ? (
              <div className="p-4 border rounded-lg">
                <div className="flex justify-end mb-2">
                  {cachedEDA && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleClearCache}
                      className="text-xs text-gray-500"
                    >
                      Clear Cache
                    </Button>
                  )}
                </div>
                <iframe 
                  src={edaViz} 
                  width="100%" 
                  height="500px"
                  title="EDA Visualization"
                  className="border-0"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <Link2Icon className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 text-center mb-4">
                  No visualization available
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => dispatch(fetchDatasetIdByProjectId(projectId))}
                >
                  Generate Visualization
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}