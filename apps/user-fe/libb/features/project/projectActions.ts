import  {createAppAsyncThunk} from "@/libb/hooks";
import { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { Project } from "./projectSlice";
const axios = require("axios").default;
const backendURL = "http://ec2-3-239-98-228.compute-1.amazonaws.com:3001"
const getConfig = (): AxiosRequestConfig => ({
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
  }
});

// const getUserId = (): string => {
//   const userId = localStorage.getItem("userId");
//   if (!userId) {
//     throw new Error("User ID not found in localStorage");
//   }
//   return userId;
// };

export const createProject = createAppAsyncThunk<
  {id:string;name:string;description:string;status:string;userId:string;createdAt:string;updatedAt:string},
  { name: string; description: string; status: string; userId:string }
>(
  "project",
  async function createProject({ name, description, status,userId }, { rejectWithValue }) {
    try {
      
      const response: AxiosResponse = await axios.post(
        `${backendURL}/project`,
        { name, description, status, userId },
        getConfig()
      );
      //TODO:type guarding before returning to ensure api returns the type we envisioned
      return{
        id:response.data.id,
        name:response.data.name,
        description:response.data.description,
        status:response.data.status,
        userId:response.data.userId,
        createdAt:response.data.createdAt,
        updatedAt:response.data.updatedAt
      }
    } catch (error: unknown) {
      console.log("From projectActions creating projects error",error)
        //TODO: custom user handling for better user experience
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string|string[]; error: string; statusCode: number }>;
        const errorMessage = axiosError.response?.data?.message;
        if (Array.isArray(errorMessage)) {
            return rejectWithValue(errorMessage.join(", "));
          }
        return rejectWithValue(errorMessage || "create project failed");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const fetchProjects = createAppAsyncThunk< 
Project[]>(
  "project/fetchProjects",
  async (_, { rejectWithValue }) => {
    try {
      const config:AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
           Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      }
      console.log("fetching projects in projectActions..");
      console.log("config",config)
      const response: AxiosResponse = await axios.get(
        `${backendURL}/project/me`,
         config
      );
      // Assuming response.data is an array of projects
      return response.data;
    } catch (error: unknown) {
      console.log("From projectActions fetching projects error",error)
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string|string[]; error: string; statusCode: number }>;
        const errorMessage = axiosError.response?.data?.message;
        if (Array.isArray(errorMessage)) {
          return rejectWithValue(errorMessage.join(", "));
        }
        return rejectWithValue(errorMessage || "Failed to fetch projects");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const patchProject = createAppAsyncThunk<
  {id:string;name:string;description:string;status:string;userId:string;createdAt:string;updatedAt:string},
  { projectId: string; name: string; description: string; status: string; userId: string }
>(
  "project/patchProject",
  async function patchProject({ projectId, name, description, status, userId }, { rejectWithValue }) {
    try {
      const response: AxiosResponse = await axios.patch(
        `${backendURL}/project/${projectId}`,
        { name, description, status, userId },
        getConfig()
      );
      return {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        status: response.data.status,
        userId: response.data.userId,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      }
    } catch (error: unknown) {
      console.log("From projectActions patching project error", error)
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string|string[]; error: string; statusCode: number }>;
        const errorMessage = axiosError.response?.data?.message;
        if (Array.isArray(errorMessage)) {
          return rejectWithValue(errorMessage.join(", "));
        }
        return rejectWithValue(errorMessage || "Failed to patch project");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const deleteProject = createAppAsyncThunk<
  {id:string;name:string;description:string;status:string;userId:string;createdAt:string;updatedAt:string},
  { projectId: string }
>(
  "project/deleteProject",
  async function deleteProject({ projectId }, { rejectWithValue }) {
    try {
      const response: AxiosResponse = await axios.delete(
        `${backendURL}/project/${projectId}`,
        getConfig()
      );
      return {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        status: response.data.status,
        userId: response.data.userId,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      }
    } catch (error: unknown) {
      console.log("From projectActions deleting project error", error)
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string|string[]; error: string; statusCode: number }>;
        const errorMessage = axiosError.response?.data?.message;
        if (Array.isArray(errorMessage)) {
          return rejectWithValue(errorMessage.join(", "));
        }
        return rejectWithValue(errorMessage || "Failed to delete project");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);
