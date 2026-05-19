import { axiosInstance } from "../lib/axios.js";

export const friendApi = {
  getPending: () => axiosInstance.get("/friends/pending"),

  search: (username) =>
    axiosInstance.get("/friends/search", {
      params: { username: username.trim() },
    }),

  sendRequest: (username) =>
    axiosInstance.post("/friends/request", { username }),

  accept: (requestId) =>
    axiosInstance.put(`/friends/accept/${requestId}`),

  reject: (requestId) =>
    axiosInstance.put(`/friends/reject/${requestId}`),

  remove: (friendId) =>
    axiosInstance.delete(`/friends/remove/${friendId}`),
};
