"use client"

import { FilterX, TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { use, useEffect, useState } from "react";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { useAppDispatch, useAppSelector } from "@/libb/hooks";
import { fetchProjects } from "@/libb/features/project/projectActions";
import { fetchDatasetIdByProjectId } from "@/libb/features/data/dataActions";
import { refresh } from "@/libb/features/auth/authActions";
import { useRouter } from "next/navigation";
import { FeatureEngineeringCard } from "@/components/ui/featureEngineering";
import { FeatureSelectionCard } from "@/components/ui/featureSelection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PageParams = {
  projectId: string[];
}

export default function DataPrepPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const { projects, status: projectStatus, error: projectError } = useAppSelector((state) => state.project);
  const { access_token, error: authError } = useAppSelector((state) => state.auth);
  const unwrappedParams = use(params);
  const project = projects.find((p) => p.id === unwrappedParams.projectId.join("/"));
  const projectId = unwrappedParams.projectId.join("/");
  const dispatch = useAppDispatch();
  console.log(projectId)
  const [datasetId, setDatasetId] = useState<string | null>(null);

  const handleStart = () => {
    dispatch(fetchDatasetIdByProjectId(projectId))
      .unwrap()
      .then((id) => {
        if (id) {
          setDatasetId(id);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch dataset ID", err);
      });
  };

  useEffect(() => {
    if (projectError) {
      if (projectError == "Unauthorized") {
        dispatch(refresh());
      }
    }
  }, [projectError]);

  useEffect(() => {
    if (access_token) {
      dispatch(fetchProjects());
    }
  }, [access_token, dispatch, router, authError]);

  if (!project) {
    return <div className="p-8">Project not found</div>;
  }

  return (
    <>
      <ProjectHeader projectId={project.id} />
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <FilterX className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold">Data Preparation</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleStart}>
            <TableIcon className="h-4 w-4 mr-2" />
            Initialize Dataset
          </Button>
        </div>

        <Tabs defaultValue="cleaning">
          <TabsList className="mb-6">
            <TabsTrigger value="cleaning">Feature Engineering</TabsTrigger>
            <TabsTrigger value="transformation">Feature Selection</TabsTrigger>
          </TabsList>

          <TabsContent value="cleaning">
            <div className="">
<FeatureEngineeringCard projectId={projectId} />
            </div>
          </TabsContent>

          <TabsContent value="transformation">
             <div className="">
                            
                            <FeatureSelectionCard projectId={projectId}  />
            
            </div>
            
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}