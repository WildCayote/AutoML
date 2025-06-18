import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from 'axios';
import { RootState } from "../../store";

// Define base API configuration
const api = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    'Content-Type': 'application/json',
  },
});

// Start Classical Training
export const startClassicalTraining = createAsyncThunk<
  void, // Return type
  string, // Args type (datasetId)
  { state: RootState, rejectValue: string }
>(
  'training/startClassicalTraining',
  async (datasetId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/training/${datasetId}/start-classical-training`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

// Fetch Classical Training Results
export const fetchClassicalTrainingResults = createAsyncThunk<
  ClassicalTrainingResult[], // Return type
  string, // Args type (datasetId)
  { state: RootState, rejectValue: string }
>(
  'training/fetchClassicalTrainingResults',
  async (datasetId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/training/${datasetId}/classical-training-results`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

// Set Training Type
export const setTrainingType = createAsyncThunk<
  { trainingType: string }, // Return type
  { datasetId: string; trainingType: string }, // Args type
  { state: RootState, rejectValue: string }
>(
  'training/setTrainingType',
  async ({ datasetId, trainingType }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/training/${datasetId}/set-training-type`,
        { trainingType }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

// Get Training Type
export const getTrainingType = createAsyncThunk<
  { trainingType: string }, // Return type
  string, // Args type (datasetId)
  { state: RootState, rejectValue: string }
>(
  'training/getTrainingType',
  async (datasetId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/training/${datasetId}/get-training-type`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

// Type definitions
export interface ClassicalTrainingResult {
  id: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  createdAt: string;
  modelType: string;
}