"use client"

import { FileBarChart, BarChart, XCircle } from "lucide-react" // Added XCircle for close button
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { use, useEffect, useState } from "react" // Added useState
import { ProjectHeader } from "@/components/dashboard/project-header"
import { useAppDispatch, useAppSelector } from "@/libb/hooks"
import { fetchProjects } from "@/libb/features/project/projectActions"
import { refresh } from "@/libb/features/auth/authActions"
import { useRouter } from "next/navigation"

type PageParams = {
  projectId: string[]
}

// Assuming report data structure based on your provided JSON
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
    reportGenerationStatus: string;
    llmError: string;
  };
  reports: Report[]; // Use the Report interface for array elements
}

export default function ReportsPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const { projects, error: projectError } = useAppSelector((state) => state.project)
  const { access_token, error: authError } = useAppSelector((state) => state.auth)
  const unwrappedParams = use(params)
  const project = projects.find((p) => p.id === unwrappedParams.projectId.join("/"))
  const dispatch = useAppDispatch()

  // State to manage the visibility of the iframe and the selected report URL
  const [showIframe, setShowIframe] = useState<boolean>(false);
  const [selectedReportUrl, setSelectedReportUrl] = useState<string | null>(null);

  // For demonstration, let's use the provided JSON directly.
  const reportData: ReportData = {
    "dataset": {
      "reportGenerationStatus": "COMPLETED",
      "llmError": ""
    },
    "reports": [
      {
        "id": "347850df-3da2-4600-b9aa-64d9854b8091",
        "datasetID": "852a6a1e-8bb4-4467-98f4-8507c71ddbc4",
        "reportHTML": "https://automldatastorage.s3.amazonaws.com/232a4dec-fb5f-4506-8d7a-27163ae30539.html",
        "reportPDF": "https://automldatastorage.s3.amazonaws.com/2fecf825-406c-4317-947c-8dbe13d4cadb.pdf",
        "createdAt": "2025-06-18T13:57:38.844Z",
        "updatedAt": "2025-06-18T13:57:38.844Z"
      },
      { // Adding another dummy report for testing multiple reports
        "id": "abcde123-4567-8901-abcd-efghijkLMNOP",
        "datasetID": "fedcba98-7654-3210-fedc-ba9876543210",
        "reportHTML": "https://automldatastorage.s3.amazonaws.com/another_report_example.html", // Placeholder URL
        "reportPDF": "https://automldatastorage.s3.amazonaws.com/another_report_example.pdf", // Placeholder URL
        "createdAt": "2025-06-19T10:00:00.000Z",
        "updatedAt": "2025-06-19T10:00:00.000Z"
      }
    ]
  };

  useEffect(() => {
    if (projectError) {
      if (projectError === "Unauthorized") {
        dispatch(refresh());
      }
    }
  }, [projectError, dispatch]);

  useEffect(() => {
    if (access_token) {
      dispatch(fetchProjects())
        .unwrap()
        .then(() => {
          // Additional logic after fetching projects if needed
        })
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
          <Button size="sm">
            <BarChart className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Model Reports</CardTitle>
            <CardDescription>View insights and performance metrics for your models</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.reports && reportData.reports.length > 0 ? (
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
                        onClick={() => handleViewHtml(report.reportHTML)} // Use onClick to show iframe
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
                <p className="text-sm text-gray-500 text-center mb-4">Train and deploy a model to generate reports</p>
                <Button variant="outline" size="sm">
                  Train Model
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Iframe Modal/Section */}
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
                // Add sandbox attributes for security if you're embedding untrusted content
                // sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </>
  )
}