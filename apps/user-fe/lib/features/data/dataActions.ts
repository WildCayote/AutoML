// src/lib/features/dataset/datasetActions.ts
import { createAppAsyncThunk } from "@/lib/hooks";
import axios from "axios";
import { Dataset } from "./datasetSlice";
import { FaLessThan } from "react-icons/fa";

const backendURL = "http://localhost:3001";
export const createDataset = createAppAsyncThunk<
  Dataset,
  { 
    name: string;
    description: string;
    projectId: string;
    format: string;
    file: File;
    start_profiling: boolean;
  }
>(
  "datasets",
  async ({ name, description, projectId, format, file, start_profiling }, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      };
      const metadata ={
        name:name,
        description:description,
        projectId:projectId,
        format:format,
        start_profiling:start_profiling
      }
      
      const formData = new FormData();
      // formData.append("name", name);
      // formData.append("description", description);
      // formData.append("projectId", projectId);
      // formData.append("format", format);
      formData.append("file", file);
      formData.append("metadata",JSON.stringify(metadata))
      // formData.append("start_profiling",start_profiling) //TODO: check if this works-assumption is server side will convert the  string back to boolean

      const response = await axios.post(
        `${backendURL}/datasets`,
        formData,
        config
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        return rejectWithValue(
          Array.isArray(errorMessage) 
            ? errorMessage.join(", ") 
            : errorMessage || "Dataset creation failed"
        );
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);
//TODO:GET or download url??-- ask Dawit if ther's a way to get the file from the backend?  
//TODO:PATCH-- test and askk


export const deleteDataset = createAppAsyncThunk<
{
  name:string,
  description:string,
  datasetId:string, //TODO: check this is it projectId or datasetId?
  format:string
},
  string
>(
  "datasets/delete",
  async (datasetId, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      };
      console.log("DFGHJGFCHj")
      const response = await axios.delete(
        `${backendURL}/datasets/${datasetId}`,
        config
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        return rejectWithValue(
          Array.isArray(errorMessage) 
            ? errorMessage.join(", ") 
            : errorMessage || "Dataset deletion failed"
        );
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const startProfiling = createAppAsyncThunk<
  {
    name:string,
    description:string,
    datasetId:string, //TODO: check this is it projectId or datasetId?
    format:string
  },
  string
>(
  "datasets/start-profiling",
  async (datasetId, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      };

      const response = await axios.patch(
        `${backendURL}/datasets/${datasetId}/start-profiling`,
        {},
        config
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        return rejectWithValue(
          Array.isArray(errorMessage) 
            ? errorMessage.join(", ") 
            : errorMessage || "Failed to start profiling"
        );
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);
