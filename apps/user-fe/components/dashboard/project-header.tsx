"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { FolderIcon, PencilIcon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppDispatch, useAppSelector } from "@/libb/hooks"
import { fetchProjects, patchProject,deleteProject} from "@/libb/features/project/projectActions"
import { cn } from "@/libb/utils"
import { refresh } from "@/libb/features/auth/authActions"
import { jwtDecode } from "jwt-decode"

interface ProjectHeaderProps {
  projectId: string
}

export function ProjectHeader({ projectId }: ProjectHeaderProps | any) {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { projects, status: projectStatus, error: projectError } = useAppSelector((state) => state.project)
  const { access_token, refresh_token, error:authError } = useAppSelector((state) => state.auth)
  const project = projects.find((p) => p.id === projectId)
  const [editProject, setEditProject] = useState({
    name: project?.name || "",
    description: project?.description || "",
    status: "ACTIVE",
  })
 
  const [open, setOpen] = useState(false)

  const handleUpdateProject = () => {
     let userId = localStorage.getItem("userId")||"unknown";
     //TODO: make this jwt decoding a separate function since it's used in create Project too
     if(userId=="unknown" &&access_token){
      try{
      const decoded = jwtDecode<{
        userId: string
        userName: string
        iat: number
        exp: number
      }>(access_token)
      userId = decoded.userId
      localStorage.setItem("userId",userId)
      }catch(error){
        console.error("Error decoding JWT:", error)
      }if(!userId){
        throw new Error("user Id Not found");
      }
     }
    if (project && editProject.name.trim()) {
      dispatch(
        patchProject({
          name: editProject.name,
          description: editProject.description,
          status: editProject.status,
          userId: userId,
          projectId:project.id,
        })
      )
      // dispatch(fetchProjects())
      setEditProject({ name: project.name, description: project.description, status: "ACTIVE" })
      setOpen(false)
    }
  }

  const handleDeleteProject = () => {
    if(project){
      dispatch(deleteProject({
        projectId:project.id
      }))
      .unwrap()
      .then(() => {
        // After successful deletion, find the next project to route to
        const currentIndex = projects.findIndex(p => p.id === project.id);
        const nextProject = projects[currentIndex + 1] || projects[currentIndex - 1];
        
        if (nextProject) {
          router.push(`/dashboard/data/${nextProject.id}`);
        } else {
          // If no other projects exist, route to dashboard
          router.push('/dashboard');
        }
      });
    }
  }

  // if (!project) {
  //   return null
  // }

  // Get the current section from the pathname
  const section = pathname.split("/").slice(-2, -1)[0] || "data"

  const sections = [
    { name: "Data", path: "data" },
    { name: "EDA", path: "eda" },
    { name: "Data Prep", path: "data-prep" },
    { name: "Model Training", path: "model-training" },
    // { name: "Deploy & Test", path: "deploy-test" },
    // { name: "Predictions", path: "predictions" },
    { name: "Reports", path: "reports" },
  ]
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
    return null;
  }
  return (
    <div className="border-b">
      <div className="flex items-center justify-between p-4">
        <div>
          <div className="flex items-center">
            <FolderIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Last updated:{" "}
            {new Date(project.updatedAt).toLocaleString(undefined, {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
              day: "numeric",
              month: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-blue-600">
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Project Name</Label>
                  <Input
                    id="edit-name"
                    value={editProject.name}
                    onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editProject.description}
                    onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editProject.status}
                    onValueChange={(value) => setEditProject({ ...editProject, status: value})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between">
                  <Button variant="destructive" onClick={handleDeleteProject}>
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button 
                  onClick={handleUpdateProject}
                  disabled={projectStatus === "loading"}
                  >
                    Save Changes</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" className="text-gray-700" onClick={handleDeleteProject}>
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex border-t">
        {sections.map((item) => {
          const isActive = section === item.path
      
          return (
            <Link
              key={item.path}
              href={`/dashboard/${item.path}/${projectId}`}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300",
              )}
            >
              {item.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}