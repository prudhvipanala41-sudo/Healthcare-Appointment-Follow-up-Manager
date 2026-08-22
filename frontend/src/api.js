import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(err) {
  if (err?.response?.status === 500) {
    return "Unable to connect to clinical directory. Please try again in a moment.";
  }
  return err?.response?.data?.error || err.message || "Something went wrong";
}


export default api;
