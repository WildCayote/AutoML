import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import {
  fetchClassicalTrainingResults,
  startClassicalTraining,
  setTrainingType,
  getTrainingType,
  ClassicalTrainingResult
} from "./trainingActions";

interface TrainingDatasetState {
  classicalResults: ClassicalTrainingResult[] | null;
  trainingType: string | null;
  loading: boolean;
  error: string | null;
  isPolling: boolean;
  lastUpdated: string | null;
}

interface TrainingState {
  datasets: Record<string, TrainingDatasetState>;
}

const initialState: TrainingState = {
  datasets: {}
};

const getInitialDatasetState = (): TrainingDatasetState => ({
  classicalResults: null,
  trainingType: null,
  loading: false,
  error: null,
  isPolling: false,
  lastUpdated: null
});

const trainingSlice = createSlice({
  name: "training",
  initialState,
  reducers: {
    clearDatasetTraining: (state, action: { payload: { datasetId: string } }) => {
      delete state.datasets[action.payload.datasetId];
    },
    stopPolling: (state, action: { payload: { datasetId: string } }) => {
      const dataset = state.datasets[action.payload.datasetId];
      if (dataset) {
        dataset.isPolling = false;
      }
    }
  },
  extraReducers: (builder) => {
    // Start Classical Training
    builder.addCase(startClassicalTraining.pending, (state, action) => {
      const datasetId = action.meta.arg;
      if (!state.datasets[datasetId]) {
        state.datasets[datasetId] = getInitialDatasetState();
      }
      state.datasets[datasetId].loading = true;
      state.datasets[datasetId].error = null;
    });
    
    builder.addCase(startClassicalTraining.fulfilled, (state, action) => {
      const datasetId = action.meta.arg;
      state.datasets[datasetId].loading = false;
      state.datasets[datasetId].isPolling = true;
      state.datasets[datasetId].lastUpdated = new Date().toISOString();
    });
    
    builder.addCase(startClassicalTraining.rejected, (state, action) => {
      const datasetId = action.meta.arg;
      state.datasets[datasetId].loading = false;
      state.datasets[datasetId].error = action.payload || 'Failed to start training';
    });

    // Fetch Classical Training Results
    builder.addCase(fetchClassicalTrainingResults.pending, (state, action) => {
      const datasetId = action.meta.arg;
      if (!state.datasets[datasetId]) {
        state.datasets[datasetId] = getInitialDatasetState();
      }
      state.datasets[datasetId].loading = true;
      state.datasets[datasetId].error = null;
    });
    
    builder.addCase(fetchClassicalTrainingResults.fulfilled, (state, action) => {
      const datasetId = action.meta.arg;
      state.datasets[datasetId].classicalResults = action.payload;
      state.datasets[datasetId].loading = false;
      state.datasets[datasetId].lastUpdated = new Date().toISOString();
    });
    
    builder.addCase(fetchClassicalTrainingResults.rejected, (state, action) => {
      const datasetId = action.meta.arg;
      state.datasets[datasetId].loading = false;
      state.datasets[datasetId].error = action.payload || 'Failed to fetch results';
    });

    // Set Training Type
    builder.addCase(setTrainingType.pending, (state, action) => {
      const { datasetId } = action.meta.arg;
      if (!state.datasets[datasetId]) {
        state.datasets[datasetId] = getInitialDatasetState();
      }
      state.datasets[datasetId].loading = true;
      state.datasets[datasetId].error = null;
    });
    
    builder.addCase(setTrainingType.fulfilled, (state, action) => {
      const { datasetId } = action.meta.arg;
      state.datasets[datasetId].trainingType = action.payload.trainingType;
      state.datasets[datasetId].loading = false;
      state.datasets[datasetId].lastUpdated = new Date().toISOString();
    });
    
    builder.addCase(setTrainingType.rejected, (state, action) => {
      const { datasetId } = action.meta.arg;
      state.datasets[datasetId].loading = false;
      state.datasets[datasetId].error = action.payload || 'Failed to set training type';
    });

    // Get Training Type
    builder.addCase(getTrainingType.pending, (state, action) => {
      const datasetId = action.meta.arg;
      if (!state.datasets[datasetId]) {
        state.datasets[datasetId] = getInitialDatasetState();
      }
      state.datasets[datasetId].loading = true;
      state.datasets[datasetId].error = null;
    });
    
    builder.addCase(getTrainingType.fulfilled, (state, action) => {
      const datasetId = action.meta.arg;
      state.datasets[datasetId].trainingType = action.payload.trainingType;
      state.datasets[datasetId].loading = false;
      state.datasets[datasetId].lastUpdated = new Date().toISOString();
    });
    
    builder.addCase(getTrainingType.rejected, (state, action) => {
      const datasetId = action.meta.arg;
      state.datasets[datasetId].loading = false;
      state.datasets[datasetId].error = action.payload || 'Failed to get training type';
    });
  }
});

export const { clearDatasetTraining, stopPolling } = trainingSlice.actions;

// Selectors
export const selectTrainingDataset = (datasetId: string) => (state: RootState) => 
  state.training.datasets[datasetId] || getInitialDatasetState();

export const selectClassicalResults = (datasetId: string) => (state: RootState) => 
  selectTrainingDataset(datasetId)(state).classicalResults;

export const selectTrainingType = (datasetId: string) => (state: RootState) => 
  selectTrainingDataset(datasetId)(state).trainingType;

export const selectTrainingLoading = (datasetId: string) => (state: RootState) => 
  selectTrainingDataset(datasetId)(state).loading;

export const selectTrainingError = (datasetId: string) => (state: RootState) => 
  selectTrainingDataset(datasetId)(state).error;

export const selectIsPolling = (datasetId: string) => (state: RootState) => 
  selectTrainingDataset(datasetId)(state).isPolling;

export const selectLastUpdated = (datasetId: string) => (state: RootState) => 
  selectTrainingDataset(datasetId)(state).lastUpdated;

export default trainingSlice.reducer;