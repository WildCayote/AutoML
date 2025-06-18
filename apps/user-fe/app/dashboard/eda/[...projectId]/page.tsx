"use client"

import { BarChart2, Link2Icon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { use, useEffect, useRef } from "react"
import { ProjectHeader } from "@/components/dashboard/project-header"
import { refresh } from "@/libb/features/auth/authActions"
import { useRouter } from "next/navigation"
import { fetchEDA } from "@/libb/hooks/fetchEDA"; // Fixed import path
import { useProjects } from "@/libb/projects-context"
import { useAppDispatch, useAppSelector } from "@/libb/hooks"
import { fetchDatasetIdByProjectId } from "@/libb/features/data/dataActions";// Import the action directly

type PageParams = {
  projectId: string[]
}

export default function EDAPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.projectId.join("/");
  const initialized = useRef(false);
  
  // Use the custom hook to fetch dataset and EDA
  const { dataset, isLoading, error, isPolling, fetchData, stopPolling } = fetchEDA(projectId);
  
  // Get project data
  const { projects, status: projectStatus, error: projectError } = useAppSelector((state) => state.project);
  const { error: authError } = useAppSelector((state) => state.auth);
  const project = projects.find((p) => p.id === projectId);

  // Initialize polling
  useEffect(() => {
    if (!initialized.current && projectId) {
      fetchData();
      
      initialized.current = true;
    }
  }, [projectId, fetchData]);

  // Handle auth errors
  useEffect(() => {
    if (projectError === "Unauthorized") {
      dispatch(refresh());
    }
  }, [projectError, dispatch]);

  if (!project) {
    return <div className="p-8">Project not found</div>;
  }

  // Get the EDA visualization data
  const edaViz = dataset?.edaReport?.url;

  // Handle retry
  const handleRetry = () => {
    dispatch(fetchDatasetIdByProjectId(projectId))
      .unwrap()
      .then((datasetId) => {
        if (datasetId) fetchData();
      });
  };

  return (
    <>
      <ProjectHeader projectId={project.id} />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold">Exploratory Data Analysis</h1>
          </div>
          <Button size="sm">
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRetry}
                >
                  Retry
                </Button>
              </div>
            ) : edaViz ? (
              <div className="p-4 border rounded-lg">
                { (
                  <iframe 
                    src={edaViz} 
                    width="100%" 
                    height="500px"
                    title="EDA Visualization"
                  />
                ) }
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