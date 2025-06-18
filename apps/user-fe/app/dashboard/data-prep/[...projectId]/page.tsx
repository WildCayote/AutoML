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
            <TabsTrigger value="cleaning">Data Cleaning</TabsTrigger>
            <TabsTrigger value="transformation">Transformations</TabsTrigger>
            <TabsTrigger value="feature-engineering">Feature Engineering</TabsTrigger>
          </TabsList>

          <TabsContent value="cleaning">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureEngineeringCard datasetId={datasetId} />
              <FeatureSelectionCard datasetId={datasetId} />
            </div>
          </TabsContent>

          <TabsContent value="transformation">
            <Card>
              <CardHeader>
                <CardTitle>Data Transformations</CardTitle>
                <CardDescription>Apply transformations to your data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <FilterX className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 text-center mb-4">No datasets available for transformation</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feature-engineering">
            <FeatureEngineeringCard datasetId={datasetId} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}