import axios from "axios";

// ✅ Automatically pick the correct backend
const BACKEND_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001/api"
    : `${import.meta.env.VITE_BACKEND_URL}/api`;

export const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // send cookies and auth headers
});

// ✅ Attach Bearer token automatically to all requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token !== "null" && token.trim() !== "") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

console.log("🌍 Axios connected to backend:", BACKEND_URL);
