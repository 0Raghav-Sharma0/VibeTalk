import axios from "axios";

// ✅ Use correct Render backend in production
const BACKEND_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001/api"
    : `${import.meta.env.VITE_BACKEND_URL}/api`;

export const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

// ✅ Automatically attach token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token !== "null" && token.trim() !== "") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.withCredentials = true;
  return config;
});

console.log("🌍 Axios connected to backend:", BACKEND_URL);
