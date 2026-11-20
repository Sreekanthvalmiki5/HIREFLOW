import axios from "axios";
import { useAuthStore } from "@/store/auth";
import type { ApiErrorBody } from "@/types/api";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  timeout: 20_000,
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expired, log out so the UI sends the user to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

// Turns any API error into one readable sentence for toasts and forms.
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Cannot reach the server. Is the backend running?";
    const body = err.response.data as ApiErrorBody | undefined;
    if (body?.error) {
      const fieldErrors = body.error.details?.fieldErrors;
      if (fieldErrors) {
        const first = Object.entries(fieldErrors).find(([, msgs]) => msgs && msgs.length > 0);
        if (first) return `${first[0]}: ${first[1]![0]}`;
      }
      return body.error.message;
    }
  }
  return "Something went wrong. Please try again.";
}
