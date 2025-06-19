"use client"

import { FileBarChart, BarChart, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useCallback, useRef, use } from "react"
import { ProjectHeader } from "@/components/dashboard/project-header"
import { useAppDispatch, useAppSelector } from "@/libb/hooks"
import { fetchProjects } from "@/libb/features/project/projectActions"
import { refresh } from "@/libb/features/auth/authActions"
import { useRouter } from "next/navigation"
import axios from "axios"
// import { API_BASE_URL } from "@/libb/constants"
import { fetchDatasetIdByProjectId } from "@/libb/features/data/dataActions"

type PageParams = {
  projectId: string[]
}

interface Report {
  id: string;
  datasetID: string;
  reportHTML: string;
  reportPDF: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportData {
  dataset: {
    reportGenerationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    llmError: string;
  };
  reports: Report[];
}

export default function ReportsPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const { projects, error: projectError } = useAppSelector((state) => state.project)
  const { access_token, error: authError } = useAppSelector((state) => state.auth)
  const unwrappedParams = use(params)
  const project = projects.find((p) => p.id === unwrappedParams.projectId.join("/"))
  const dispatch = useAppDispatch()

  const [showIframe, setShowIframe] = useState<boolean>(false);
  const [selectedReportUrl, setSelectedReportUrl] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const API_BASE_URL = "http://ec2-34-239-157-156.compute-1.amazonaws.com:3001"
  // Fetch report data
  const fetchReportData = useCallback(async (datasetId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/training/${datasetId}/report-generation`);
      setReportData(response.data);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch report data", err);
      setError("Failed to fetch report data");
      return null;
    }
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Start polling for report status
  const startPolling = useCallback((datasetId: string) => {
    stopPolling();
    
    // Initial fetch
    fetchReportData(datasetId).then(data => {
      if (data && data.dataset.reportGenerationStatus !== 'COMPLETED') {
        pollingIntervalRef.current = setInterval(async () => {
          const updatedData = await fetchReportData(datasetId);
          if (updatedData?.dataset.reportGenerationStatus === 'COMPLETED') {
            stopPolling();
            setIsGenerating(false);
          } else if (updatedData?.dataset.reportGenerationStatus === 'FAILED') {
            stopPolling();
            setIsGenerating(false);
            setError(updatedData.dataset.llmError || "Report generation failed");
          }
        }, 5000); // Poll every 5 seconds
      } else {
        setIsGenerating(false);
      }
    });
  }, [fetchReportData, stopPolling]);

  // Start report generation process
  const startReportGeneration = useCallback(async () => {
    if (!project?.id) {
      setError("Project ID is not available");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setReportData(null);
    stopPolling();

    try {
      // First get the dataset ID
      const id = await dispatch(fetchDatasetIdByProjectId(project.id)).unwrap();
      if (!id) {
        throw new Error("Dataset ID not found");
      }
      setDatasetId(id);

      // Start report generation
      await axios.patch(`${API_BASE_URL}/training/${id}/start-report-generation`);

      // Start polling for results
      startPolling(id);

    } catch (err: any) {
      console.error("Failed to start report generation", err);
      setError(err.message || "Failed to start report generation");
      setIsGenerating(false);
      stopPolling();
    }
  }, [project?.id, dispatch, startPolling, stopPolling]);

  // Initialize data on mount
  useEffect(() => {
    const initialize = async () => {
      if (project?.id) {
        try {
          const id = await dispatch(fetchDatasetIdByProjectId(project.id)).unwrap();
          if (id) {
            setDatasetId(id);
            await fetchReportData(id);
          }
        } catch (err) {
          console.error("Failed to initialize report data", err);
        }
      }
    };
    initialize();

    return () => {
      stopPolling();
    };
  }, [project?.id, dispatch, fetchReportData, stopPolling]);

  useEffect(() => {
    if (projectError) {
      if (projectError === "Unauthorized") {
        dispatch(refresh());
      }
    }
  }, [projectError, dispatch]);

  useEffect(() => {
    if (access_token) {
      dispatch(fetchProjects());
    }
  }, [access_token, dispatch]);

  const handleViewHtml = (url: string) => {
    setSelectedReportUrl(url);
    setShowIframe(true);
  };

  const handleCloseIframe = () => {
    setShowIframe(false);
    setSelectedReportUrl(null);
  };

  if (!project) {
    return <div className="p-8">Project not found</div>
  }

  return (
    <>
      <ProjectHeader projectId={project.id} />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileBarChart className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold">Reports</h1>
          </div>
          <Button 
            size="sm" 
            onClick={startReportGeneration}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <BarChart className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Model Reports</CardTitle>
            <CardDescription>View insights and performance metrics for your models</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData?.reports && reportData.reports.length > 0 ? (
              <div className="grid gap-4">
                {reportData.reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm">
                    <div>
                      <h3 className="font-semibold text-base mb-1">Report ID: {report.id.substring(0, 8)}...</h3>
                      <p className="text-sm text-gray-600">Generated: {new Date(report.createdAt).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Dataset ID: {report.datasetID.substring(0, 8)}...</p>
                    </div>
                    <div className="flex gap-2 mt-3 md:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewHtml(report.reportHTML)}
                      >
                        View HTML
                      </Button>
                      <a href={report.reportPDF} target="_blank" rel="noopener noreferrer">
                        <Button size="sm">Download PDF</Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <FileBarChart className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 text-center mb-4">
                  {isGenerating 
                    ? "Report generation in progress..." 
                    : "Generate a report to view insights"}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={startReportGeneration}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showIframe && selectedReportUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-lg w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">HTML Report View</h2>
              <Button variant="ghost" size="icon" onClick={handleCloseIframe}>
                <XCircle className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </Button>
            </div>
            <div className="flex-grow">
              <iframe
                src={selectedReportUrl}
                title="HTML Report"
                className="w-full h-full border-0"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </>
  )
}