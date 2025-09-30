import {create} from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import {io} from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create ((set, get) => ({
    authUser : null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth : true,
    onlineUsers: [],
    socket:null,

    checkAuth: async () => {
        const token = localStorage.getItem("token"); // ✅ Check for token first
    
        if (!token) {
            set({ authUser: null, isCheckingAuth: false });
            return; // 🚫 Skip if there's no token
        }
    
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data });
            get().connectSocket();
        } catch (error) {
            console.log("Error in checkAuth:", error.message);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", data);
    
            // ✅ Save the token from the response
            const token = res.data.token;
            if (token) {
                localStorage.setItem("token", token); // ✅ Store token in localStorage
            }
    
            set({ authUser: res.data });
            toast.success("Account created successfully");
            get().connectSocket();
            return true;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Signup failed. Please try again.";
            toast.error(errorMessage);
            return false;
        } finally {
            set({ isSigningUp: false });
        }
    },
    

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
    
            // ✅ Save the token from the response
            const token = res.data.token;
            if (token) {
                localStorage.setItem("token", token); // ✅ Store token in localStorage
            }
    
            set({ authUser: res.data });
            toast.success("Logged in successfully");
            get().connectSocket();
            await get().checkAuth(); // ✅ Ensures the user is authenticated correctly
            return true;
        } catch (error) {
            console.error("Login failed:", error);
            const errorMessage = error.response?.data?.message || "Invalid credentials. Please try again.";
            toast.error(errorMessage);
            return false;
        } finally {
            set({ isLoggingIn: false });
        }
    },
    
    
    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            localStorage.removeItem("token");
            set({ authUser: null });
            toast.success("Logged Out Successfully");
            setTimeout(() => {
                get().disconnectSocket();
                window.location.href = '/login';
            }, 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || "Logout failed.");
        }
    },

    updateProfile: async(data) => {
        set({isUpdatingProfile: true});
        try{
            const res = await axiosInstance.post("/auth/update-profile", data);
            set({authUser: res.data});
            toast.success("Profile updated successfully");
        }catch(error){
            console.log("Error in update profile :", error);
            toast.error(error.response?.data?.message);
        } finally{
            set({ isUpdatingProfile: false});
        }
    },

    connectSocket: () => {
        const {authUser} = get();
        if(!authUser || get().socket?.connected){
            return;
        }
        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            },
        });
        socket.connect();
        set({socket: socket});
        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds});
        })
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if(socket){
            socket.disconnect();
            set({socket: null});
        }
    }
}));