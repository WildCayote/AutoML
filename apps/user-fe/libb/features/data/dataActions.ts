// src/lib/features/data/datasetActions.ts
import { createAppAsyncThunk } from "@/libb/hooks";
import axios from "axios";
import { Dataset, EDAReport } from "./datasetSlice";
// import { FaLessThan } from "react-icons/fa";

const backendURL = "http://ec2-3-239-98-228.compute-1.amazonaws.com:3001";
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
      console.log("metadata",metadata)
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("projectId", projectId);
      formData.append("format", format);
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

      const EDAresponse = await axios.get(
        `${backendURL}/datasets/${datasetId}/eda`,
        config
      );
      if (EDAresponse.data.profilingStatus == "COMPLETED" || EDAresponse.data.profilingStatus == "IN_PROGRESS"){
        return
      }

      const response = await axios.patch(
        `${backendURL}/datasets/${datasetId}/start-profiling`,
        {},
        config
      );
      console.log("start profiling log",response)
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


export const specifyTargetColumn = createAppAsyncThunk<
  { 
    datasetId: string;
    taskType: "CLASSIFICATION" | "REGRESSION";
    targetColumnName: string;
    // Only return what changed instead of full dataset
  },
  {
    datasetId: string;
    taskType: "CLASSIFICATION" | "REGRESSION";
    targetColumnName: string;
  }
>(
  "dataset/specifyTarget",
  async ({ datasetId, taskType, targetColumnName }, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      };
      
      const response = await axios.patch( // Changed to PATCH since we're updating
        `${backendURL}/datasets/${datasetId}/specify-targets`,
        { taskType, targetColumnName },
        config
      );

      // Return minimal data instead of full dataset
      console.log("specifying columns log",response)
      return { 
        datasetId,
        taskType,
        targetColumnName,
        ...(response.data || {}) // Include any additional response data
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || "Failed to specify target column");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);


// Add these to your existing dataActions.ts

export const fetchDatasetIdByProjectId = createAppAsyncThunk<
  string, // Returns just the dataset ID string
  string  // projectId as input
>(
  "datasets/fetchIdByProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      };
      
      const response = await axios.get(
        `${backendURL}/datasets/project/${projectId}`,
        config
      );
      
      // Assuming API returns { id: "123" }
      console.log("fetched id by project ",response)
      return response.data[0].id;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || "No dataset found for this project");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const fetchDatasetById = createAppAsyncThunk<
  Dataset,  // Returns full Dataset object
  string    // datasetId as input
>(
  "datasets/fetchById",
  async (datasetId, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      };
      
      const response = await axios.get(
        `${backendURL}/datasets/${datasetId}`,
        config
      );
      console.log("fetched data by id ",response)
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch dataset");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);


export const fetchEDAByDatasetId = createAppAsyncThunk<
  Dataset,  // Returns EDA report object
  string      // datasetId as input
>(
  "datasets/fetchEDA",
  async (datasetId, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      };
      
      const response = await axios.get(
        `${backendURL}/datasets/${datasetId}/eda`,
        config
      );
      console.log("fetch eda log", response)
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch EDA report");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);


export const startFeatureEngineering = createAppAsyncThunk<
  string,
  string
>(
  "datasets/start-feature-engineering",
  async (datasetId, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      };

      const FeatureEngineeringResponse = await axios.get(
        `${backendURL}/datasets/${datasetId}/feature-engineering`,
        config
      );
      console.log(FeatureEngineeringResponse)
      if (FeatureEngineeringResponse.data.featureEngineeringStatus == "COMPLETED" || FeatureEngineeringResponse.data.featureEngineeringStatus == "IN_PROGRESS"){
        return
      }

      const response = await axios.patch(
        `${backendURL}/datasets/${datasetId}/start-feature-engineering`,
        {},
        config
      );
      console.log("start feature engineering log",response)
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        return rejectWithValue(
          Array.isArray(errorMessage) 
            ? errorMessage.join(", ") 
            : errorMessage || "Failed to start feature engineering"
        );
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);


export const fetchFeatureEngineeringResults = createAppAsyncThunk<
 any,  // Returns EDA report object
  string      // datasetId as input
>(
  "datasets/fetchFeatureEngineering",
  async (datasetId, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      };
      
      const response = await axios.get(
        `${backendURL}/datasets/${datasetId}/feature-engineering`,
        config
      );
      console.log("fetch feature engineering log", response)
      // const { data } = await axios.get(`/datasets/${datasetId}/feature-engineering`);
      return { datasetId, vizUrl: response.data.featureEngineeringVizFile };
      // return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch EDA report");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);


export const startFeatureSelection = createAppAsyncThunk<
  string,
  string
>(
  "datasets/start-feature-Selection",
  async (datasetId, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      };

      const FeatureSelectionResponse = await axios.get(
        `${backendURL}/datasets/${datasetId}/feature-selection`,
        config
      );
      if (FeatureSelectionResponse.data.featureSelectionStatus == "COMPLETED" || FeatureSelectionResponse.data.featureSelectionStatus == "IN_PROGRESS"){
        return
      }

      const response = await axios.patch(
        `${backendURL}/datasets/${datasetId}/start-feature-selection`,
        {},
        config
      );
      console.log("start feature selection log",response)
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        console.log("error while tryig to access feature selection log", errorMessage)
        console.log("error while tryig to access feature selection log", error)
        return rejectWithValue(
          Array.isArray(errorMessage) 
            ? errorMessage.join(", ") 
            : errorMessage || "Failed to start feature engineering"
        );
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

// /datasets/{id}/feature-selection
export const fetchFeatureSelectionResults = createAppAsyncThunk<
 any,  // Returns EDA report object
  string      // datasetId as input
>(
  "datasets/fetchFeatureSelection",
  async (datasetId, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
        }
      };
      
      const response = await axios.get(
        `${backendURL}/datasets/${datasetId}/feature-selection`,
        config
      );
      console.log("fetch feature selection log", response)
      // const { data } = await axios.get(`/datasets/${datasetId}/feature-engineering`);
      return { datasetId, featVizUrl: response.data.FeaturesVizFile };
      // return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch EDA report");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);
