"use client"

import { useProjects } from "@/lib/projects-context"
import { BarChart2, Link2Icon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { use,useEffect, useState } from "react"
import { ProjectHeader } from "@/components/dashboard/project-header"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { createProject, fetchProjects } from "@/lib/features/project/projectActions"
import { refresh } from "@/lib/features/auth/authActions"
import {useRouter} from "next/navigation"
type PageParams = {
  projectId: string[]
}

export default function EDAPage({ params }: { params: Promise<PageParams> }) {
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

  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHtml = async () => {
      try {
        const response = await fetch('http://127.0.0.1:4000/');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        setHtmlContent(html);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHtml();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!project) {
    return <div className="p-8">Project not found</div>
  }

  // load an html page from an api endpoint
  
  return (
    <>
      <ProjectHeader projectId={project.id} />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold">Exploratory Data Analysis</h1>
          </div>
          
        </div>

        <Card className="mb-8" dangerouslySetInnerHTML={{ __html: htmlContent }}>
          
          
        </Card>
      </div>
    </>
  )
}