"use client"

import { Database, UploadIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { use, useEffect } from "react"
import { ProjectHeader } from "@/components/dashboard/project-header"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { createProject, fetchProjects } from "@/lib/features/project/projectActions"
import { refresh } from "@/lib/features/auth/authActions"
import {useRouter} from "next/navigation"
import DataUploader from "@/components/ui/dataUploader"

type PageParams = {
  projectId: string[]
}

export default function DataPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const { projects, status: projectStatus, error: projectError } = useAppSelector((state) => state.project)
  const { access_token, refresh_token, error:authError } = useAppSelector((state) => state.auth)
  const unwrappedParams = use(params)
  const project = projects.find((p) => p.id === unwrappedParams.projectId.join("/"))
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (projectError) {
      // console.log("use Effect projectError", projectError);
      if (projectError == "Unauthorized") {
        dispatch(refresh());
      }
    }
  }, [projectError]);
  useEffect(() => {
    if (access_token) {
        dispatch(fetchProjects())
            .unwrap()
            .then(() => {
               
            })
    }
}, [access_token, dispatch, router, authError]);
  if (!project) {
    return <div className="p-8">Project not fouvcfxdsnd</div>
  }
 

  return (
    <>
      <ProjectHeader projectId={project.id} />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold">Data</h1>
          </div>
          {/* <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <UploadIcon className="h-4 w-4 mr-2" />
              Upload Dataset
            </Button>
            <Button size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Connect Data Source
            </Button>
          </div> */}
        </div>

        <div>
          <Card>
            {/* <CardHeader className="pb-2">
              <CardTitle className="text-lg">No Datasets</CardTitle>
              <CardDescription>Upload or connect a dataset to get started</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
                <Database className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 text-center mb-4">
                  Drag and drop your CSV, Excel, or JSON files here
                </p>
                <Button variant="outline" size="sm">
                  Browse Files
                </Button>
              </div>
            </CardContent> */}
            <DataUploader projectId={project.id} />
          </Card>
        </div>
      </div>
    </>
  )
}
