import axios from "axios";
import { getClerkToken } from "./tokenBridge.js";
import { env } from "../config/env.js";

export const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = await getClerkToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("API unauthorized — session may have expired");
    }
    return Promise.reject(error);
  }
);
