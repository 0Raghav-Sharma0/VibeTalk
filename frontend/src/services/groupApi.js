import { axiosInstance } from "../lib/axios.js";

export const groupApi = {
  list: () => axiosInstance.get("/groups"),

  create: (body) => axiosInstance.post("/groups", body),

  getMessages: (groupId, params) =>
    axiosInstance.get(`/groups/${groupId}/messages`, { params }),

  sendMessage: (groupId, body) =>
    axiosInstance.post(`/groups/${groupId}/messages`, body),

  addMember: (groupId, userId) =>
    axiosInstance.post(`/groups/${groupId}/members`, { userId }),

  removeMember: (groupId, userId) =>
    axiosInstance.delete(`/groups/${groupId}/members/${userId}`),

  leave: (groupId) => axiosInstance.post(`/groups/${groupId}/leave`),
};
