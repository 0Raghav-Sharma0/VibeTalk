import axios from "axios";

const BACKEND_URL = import.meta.env.MODE === "development"
  ? "http://localhost:5001/api"
  : import.meta.env.REACT_APP_BACKEND_URL || "https://chitchat-vvxt.onrender.com/api";

export const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token !== "null" && token.trim() !== "") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.withCredentials = true;
  return config;
});
