"use client";

import { Database, UploadIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { use, useEffect, useRef } from "react";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  createProject,
  fetchProjects,
} from "@/lib/features/project/projectActions";
import { refresh } from "@/lib/features/auth/authActions";
import { deleteDataset } from "@/lib/features/data/dataActions";
import { useRouter } from "next/navigation";

import DataUploaderr,{ DataUploaderRef } from "@/components/ui/dataUploader";

type PageParams = {
  projectId: string[];
};

export default function DataPage({ params }: { params: Promise<PageParams> }) {
  const uploaderRef = useRef<DataUploaderRef>(null);

  const triggerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    uploaderRef.current?.handleFileUpload(event);
  };
  const router = useRouter();
  const {
    projects,
    status: projectStatus,
    error: projectError,
  } = useAppSelector((state) => state.project);
  const {
    datasets,
    status,
    error: datasetsError,
    hasLocalFile
  } = useAppSelector((state) => state.data);
  const {
    access_token,
    refresh_token,
    error: authError,
  } = useAppSelector((state) => state.auth);
  const unwrappedParams = use(params);
  const project = projects.find(
    (p) => p.id === unwrappedParams.projectId.join("/")
  );
  const dispatch = useAppDispatch();
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
        .then(() => {});
    }
  }, [access_token, dispatch, router, authError]);
  if (!project) {
    return <div className="p-8">Project not fouvcfxdsnd</div>;
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
          <div className="flex space-x-2">
            {hasLocalFile&& (
              <label className="cursor-pointer">
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                Choose File
              </span>
              <input type="file" accept=".csv,.json,.xlsx,.xls" className="hidden" onChange={triggerUpload} />
            </label>
        
            )}
            {hasLocalFile&& (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
                    // If user confirms, dispatch delete action
                    dispatch(deleteDataset("datasetID"))//TODO:testing with dummy id fix when backend works
                      .unwrap()
                      .then(() => {
                        // Optional: Show success message or handle success
                        console.log('Dataset deleted successfully');
                      })
                      .catch((error) => {
                        // Optional: Show error message or handle error
                        console.error('Failed to delete dataset:', error);
                      });
                  }
                }}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Dataset
              </Button>
            )}
          </div>
        </div>

        <div>
          <Card>
            <DataUploaderr 
            ref ={uploaderRef}
            projectId={project.id} 
          
            />
          </Card>
        </div>
      </div>
    </>
  );
}
