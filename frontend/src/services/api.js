import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const health = () => api.get("/health");

export const chat = (data) => api.post("/chat", data);

export const getMessages = (session_id) =>
  api.get(`/sessions/${encodeURIComponent(session_id)}/messages`);

export const extractError = (err) => {
  if (err && err.response) {
    if (err.response.data && err.response.data.detail) return err.response.data.detail;
    if (err.response.status === 503) return "All providers unavailable. Please try again.";
    return err.response.data?.message || "Request failed.";
  }
  if (!err || !err.response) return "Network error. Unable to reach the backend.";
  return "An unexpected error occurred.";
};
