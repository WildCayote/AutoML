"use client"

import { useProjects } from "@/libb/projects-context"
import { Brain, PlayIcon, Wand2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { use, useState, useEffect } from "react"
import { ProjectHeader } from "@/components/dashboard/project-header"
import { useAppDispatch, useAppSelector } from "@/libb/hooks"
import { createProject, fetchProjects } from "@/libb/features/project/projectActions"
import { refresh } from "@/libb/features/auth/authActions"
import { useRouter } from "next/navigation"
import { fetchDatasetIdByProjectId } from "@/libb/features/data/dataActions"
import axios from "axios"

type PageParams = {
  projectId: string[]
}

type TrainingResult = {
  modelType: string;
  accuracy: number;
  f1Score: number;
  precision: number;
  recall: number;
  createdAt: string;
}

export default function ModelTrainingPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const { projects, status: projectStatus, error: projectError } = useAppSelector((state) => state.project)
  const { access_token, refresh_token, error: authError } = useAppSelector((state) => state.auth)
  const unwrappedParams = use(params)
  const projectId = unwrappedParams.projectId.join("/");
  const project = projects.find((p) => p.id === projectId)
  const dispatch = useAppDispatch()
  const [datasetId, setDatasetId] = useState<string>("")
  const [trainingType, setTrainingType] = useState<string>("")
  const [classicalResults, setClassicalResults] = useState<TrainingResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null)

  // Fetch dataset ID when component mounts
  useEffect(() => {
    const fetchDatasetId = async () => {
      try {
        const result = await dispatch(fetchDatasetIdByProjectId(projectId))
        if (result.payload) {
          console.log("This is fetching id and setting id", result)
          setDatasetId(result.payload)
        }
      } catch (err) {
        setError("Failed to fetch dataset ID")
      }
    }
    
    fetchDatasetId()
  }, [projectId, dispatch])

  // Handle authentication errors
  useEffect(() => {
    if (projectError) {
      if (projectError == "Unauthorized") {
        dispatch(refresh());
      }
    }
  }, [projectError]);

  // Fetch projects when access token changes
  useEffect(() => {
    if (access_token) {
      dispatch(fetchProjects())
        .unwrap()
        .then(() => {})
    }
  }, [access_token, dispatch, router, authError]);

  // Set up axios instance with auth headers
  const api = axios.create({
    baseURL: "http://localhost:3001",
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  })
  const handleDatasetId = async () => {
    try {
    // const result = await dispatch(fetchDatasetIdByProjectId(projectId))
    const result = await dispatch(fetchDatasetIdByProjectId(projectId))
        if (result.payload) {
          console.log("This is fetching id and setting id", result)
          setDatasetId(result.payload)
          console.log(datasetId)
        }
    }catch(err){
      console.log(err)
    }
  }
  const handleSetTrainingType = async (type: string) => {
    if (!datasetId) {
      setError("Dataset ID not available")
      return
    }
    
    setTrainingType(type)
    setIsLoading(true)
    setError(null)
    
    try {
      await api.post(`/training/${datasetId}/set-training-type`, {
           trainingType: "CLASSICAL" // Assuming this always needs to be "classical"
      })
      await api.patch(`/training/${datasetId}/start-classical-training`)
    } catch (err) {
      setError("Failed to set training type")
      setIsLoading(false)
    }
  }

  const handleStartTraining = async () => {
    if (!datasetId || !trainingType) {
      setError("Dataset ID or training type not set")
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // First set the training type (if not already done)
      await api.post(`/training/${datasetId}/set-training-type`, {
        trainingType: "CLASSICAL"
      })
      
      // Then start the training
      await api.patch(`/training/${datasetId}/start-classical-training`)
      
      // Start polling for results
      startPolling()
    } catch (err) {
      setError("Failed to start training")
      setIsLoading(false)
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setIsPolling(false)
      }
    }
  }

  const fetchTrainingResults = async () => {
    if (!datasetId) return
    
    try {
      const response = await api.get(`/training/${datasetId}/classical-training-results`)
      setClassicalResults(response.data)
      console.log(response)
      setLastUpdateTime(new Date().toLocaleTimeString())
    } catch (err) {
      setError("Failed to fetch training results")
    }
  }

  const startPolling = () => {
    setIsPolling(true)
    // Initial fetch
    fetchTrainingResults()
    
    // Set up interval for polling every 30 seconds
    const interval = setInterval(() => {
      fetchTrainingResults()
    }, 30000)
    
    setPollingInterval(interval)
  }

  const stopTrainingPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    setIsPolling(false)
    setIsLoading(false)
  }

  const handleRefresh = () => {
    fetchTrainingResults()
  }

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  if (!project) {
    return <div className="p-8">Project not found</div>
  }

  const isDisabled = isLoading || !datasetId

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Model Training</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="text-red-500 p-2 rounded bg-red-50">{error}</div>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => handleSetTrainingType("RandomForest")}
              disabled={isDisabled}
              variant={trainingType === "RandomForest" ? "default" : "outline"}
              className="flex-1 min-w-[150px]"
            >
              Random Forest
            </Button>
            <Button 
              onClick={() => handleSetTrainingType("LogisticRegression")}
              disabled={isDisabled}
              variant={trainingType === "LogisticRegression" ? "default" : "outline"}
              className="flex-1 min-w-[150px]"
            >
              Logistic Regression
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleStartTraining}
              className="flex-1 min-w-[150px]"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              {isLoading ? "Training..." : "Start Training"}
            </Button>
            
            <Button
              onClick={handleRefresh}
              disabled={isDisabled}
              variant="outline"
              className="flex-1 min-w-[150px]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          
          {isPolling && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Auto-refreshing every 30 seconds...
              </div>
              <Button
                onClick={stopTrainingPolling}
                variant="ghost"
                size="sm"
              >
                Stop
              </Button>
            </div>
          )}
          
          {lastUpdateTime && (
            <div className="text-xs text-muted-foreground text-right">
              Last updated: {lastUpdateTime}
            </div>
          )}
          
          {classicalResults && classicalResults.length > 0 && (
            <div className="space-y-4 mt-4">
              <h3 className="font-medium">Training Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {classicalResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-3 shadow-sm">
                    <div className="font-medium">{result.modelType}</div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Accuracy</div>
                        <div className="font-medium">{(result.accuracy * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">F1 Score</div>
                        <div className="font-medium">{result.f1Score.toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Precision</div>
                        <div className="font-medium">{result.precision.toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Recall</div>
                        <div className="font-medium">{result.recall.toFixed(3)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(result.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={startPolling}>get</button>
        <button onClick={handleDatasetId}>id</button>
      </CardContent>
    </Card>
  )
}