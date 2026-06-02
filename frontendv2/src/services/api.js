// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://lost-n-found-production.up.railway.app", // FastAPI
});

// attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
