// src/lib/features/dataset/datasetSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createDataset, deleteDataset,startProfiling } from "./dataActions";

export interface Dataset {
  id: string;
  name: string;
  description: string;
  projectId: string;
  status: string;
  file: string;
  format: string;
  size: number;
  rows: number | null;
  cols: number | null;
  createdAt: string;
  updatedAt: string;
}

interface DatasetState {
  datasets: Dataset[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null | string[];
  hasLocalFile:boolean;
  deleted:boolean
}

const initialState: DatasetState = {
  datasets: [],
  status: "idle",
  error: null,
  hasLocalFile:false,
  deleted:false
};

const datasetSlice = createSlice({
  name: "dataset",
  initialState,
  reducers: {
    setLocalFile: (state, action: PayloadAction<boolean>) => {
      state.hasLocalFile = action.payload;
    },
    clearLocalFile: (state) => {
      state.hasLocalFile = false;
    },
    //TODO: for mocking integration
    setDeleted: (state, action) => {
      state.deleted = action.payload;
      state.status = "idle"
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDataset.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createDataset.fulfilled, (state, action: PayloadAction<Dataset>) => {
        state.status = "succeeded";
        state.datasets.push(action.payload);
      })
      .addCase(createDataset.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string | string[];
      })
      .addCase(deleteDataset.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteDataset.fulfilled, (state) => {
        state.status = "succeeded";
        state.datasets = [];
      })
      .addCase(deleteDataset.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string | string[];
        //TODO:CHANGGEE FOR TESTINGONKY
        state.deleted = true

      }) .addCase(startProfiling.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(startProfiling.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(startProfiling.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string | string[];
      })
  }
});

export default datasetSlice.reducer;
export const { setLocalFile, clearLocalFile,setDeleted } = datasetSlice.actions;