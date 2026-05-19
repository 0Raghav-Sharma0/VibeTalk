import { axiosInstance } from "../lib/axios.js";

export const messageApi = {
  getSidebarUsers: () => axiosInstance.get("/messages/users"),

  getMessages: (userId, params = {}) =>
    axiosInstance.get(`/messages/${userId}`, { params }),

  /** WhatsApp-style incremental sync after reconnect */
  syncMessages: (userId, since) =>
    axiosInstance.get(`/messages/${userId}`, { params: { since, limit: 100 } }),

  sendMessage: (userId, body) =>
    axiosInstance.post(`/messages/send/${userId}`, body),

  addReaction: (body) => axiosInstance.post("/messages/reaction", body),

  uploadFile: (formData) =>
    axiosInstance.post("/messages/upload-file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
