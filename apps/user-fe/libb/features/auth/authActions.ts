import { createAppAsyncThunk, useAppSelector } from "@/libb/hooks";
import { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
const axios = require("axios").default;
const backendURL = "http://ec2-34-239-157-156.compute-1.amazonaws.com:3001";
const config: AxiosRequestConfig = {
  headers: {
    "Content-Type": "application/json",
  },
};

export const signup = createAppAsyncThunk<
  { id: string; email: string; username: string },
  { email: string; password: string; username: string }
>(
  "auth/signup",
  async function authsignup(
    { email, password, username },
    { rejectWithValue }
  ) {
    try {
      const response: AxiosResponse = await axios.post(
        `${backendURL}/auth/signup`,
        { email, password, username },
        config
      );
      //TODO:type guarding before returning to ensure api returns the type we envisioned
      return {
        id: response.data.id,
        email: response.data.email,
        username: response.data.username,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{
          message: string | string[];
          error: string;
          statusCode: number;
        }>;
        const errorMessage = axiosError.response?.data?.message;
        if (Array.isArray(errorMessage)) {
          return rejectWithValue(errorMessage.join(", "));
        }
        return rejectWithValue(errorMessage || "signup failed");
      }
      return rejectWithValue("An unknown error occured");
    }
  }
);
export const login = createAppAsyncThunk<
  { access_token: string; refresh_token: string },
  { email: string; password: string; username: string }
>(
  "auth/login",
  async function authLogin({ email, password, username }, { rejectWithValue }) {
    try {
      const response: AxiosResponse = await axios.post(
        `${backendURL}/auth/signin`,
        { email, password, username },
        config
      );
      //TODO:type guarding before returning to ensure api returns the type we envisioned
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{
          message: string;
          error: string;
          statusCode: number;
        }>;
        const errorMessage = axiosError.response?.data?.message;
        return rejectWithValue(errorMessage || "Login failed");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);
export const refresh = createAppAsyncThunk<{ access_token: string }>(
  "auth/refresh",
  async function authRefresh(_, { rejectWithValue }) {
    try {
      const refresh_config: AxiosRequestConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            typeof window !== "undefined"
              ? localStorage.getItem("refresh_token")
              : ""
          }`,
        },
      };
      console.log("refresh_config", refresh_config);
      const response: AxiosResponse = await axios.post(
        `${backendURL}/auth/refresh`,
        {},
        refresh_config
      );
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", response.data.access_token);
      }
      return {
        access_token: response.data.access_token,
      };
    } catch (error: unknown) {
      console.log("error in refresh", error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{
          message: string;
          error: string;
          statusCode: number;
        }>;
        const errorMessage = axiosError.response?.data?.message;
        return rejectWithValue(
          errorMessage || "Refresh failed , please login in again"
        );
      }
      return rejectWithValue("please login again");
    }
  }
);

export const logout = createAppAsyncThunk<
  void,
  void
>(
  "auth/logout",
  async function authLogout(_, { rejectWithValue, getState }) {
    try {
      const logout_config: AxiosRequestConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            typeof window !== "undefined"
              ? localStorage.getItem("refresh_token")
              : ""
          }`,
        },
      };
      await axios.post(`${backendURL}/auth/logout`, {}, logout_config);
      if(typeof window !== "undefined") {
      localStorage.clear();
      }
      return;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message: string }>;
        return rejectWithValue(axiosError.response?.data?.message || "Logout failed");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);