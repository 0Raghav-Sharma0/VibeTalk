import { axiosInstance } from "../lib/axios.js";

export const authApi = {
  sync(profile) {
    return axiosInstance.post("/auth/sync", profile);
  },

  checkAuth() {
    return axiosInstance.get("/auth/check-auth");
  },

  updateProfile(data) {
    return axiosInstance.put("/auth/update-profile", data);
  },
};
