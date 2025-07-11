import {Action, ThunkAction, configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice"; // Authentication slice
import projectReducer from "./features/project/projectSlice";
import dataSlice from "./features/data/datasetSlice";
//TODO:USE REDUX PERSIST INSTEAD LATER
export const store = configureStore({
  reducer: {
    auth: authReducer,
    project:projectReducer,
    data:dataSlice
  },
});

// Infer types from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
// export type AppThunk = ThunkAction<void, RootState, unknown, Action>