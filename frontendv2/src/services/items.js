// src/services/items.js
import API from "./api";

export const getItems = (params) =>
  API.get("/items", { params });

export const getMyItems = (params) =>
  API.get("/items/my", { params });

export const createItem = (formData) =>
  API.post("/items", formData);

export const deleteItem = (id) =>
  API.delete(`/items/${id}`);

export const updateItem = (id, formData) =>
  API.put(`/items/${id}`, formData);

export const claimItem = (id, formData) =>
  API.post(`/items/claim`, formData);

export const approveClaim = (itemId, email) =>
  API.post(`/items/${itemId}/claims/${email}/approve`);

export const rejectClaim = (itemId, email) =>
  API.post(`/items/${itemId}/claims/${email}/reject`);

export const getAIrecommendation = (id) =>
  API.get(`/items/${id}/recommendation`);