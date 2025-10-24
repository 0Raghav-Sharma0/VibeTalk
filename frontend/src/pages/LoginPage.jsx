import React, { useState } from 'react';
import { useAuthStore } from "../store/useAuthStore.js";
import lottie from "lottie-web";
import { defineElement } from "@lordicon/element";
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import AuthImagePattern from '../components/AuthImagePattern.jsx';
import image1 from "../images/login_image_1.jpg";
import image2 from "../images/login_image_2.jpg";
import image3 from "../images/login_image_3.jpg";
import image4 from "../images/login_image_4.jpg";
import image5 from "../images/login_image_5.jpg";
import image6 from "../images/login_image_6.jpg";
import image7 from "../images/login_image_7.jpg";
import image8 from "../images/login_image_8.jpg";
import image9 from "../images/login_image_9.jpg";
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

defineElement(lottie.loadAnimation);

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      await login(formData);
    } catch (error) {
      toast.error(error.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-24 h-24">
                <lord-icon trigger="loop" src="/wired-flat-268-avatar-man-hover-glance.json" style={{ width: "100px", height: "100px" }}></lord-icon>
              </div>
              <h1 className="text-2xl font-bold mt-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500">Welcome Back to VibeTalk</h1>
              <p className="text-base-content/60">Sign in to start vibing with your friends</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Email</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-base-content/40" /></div>
                <input type="email" className="input input-bordered w-full pl-10" placeholder="you@example.com"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Password</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-base-content/40" /></div>
                <input type={showPassword ? "text" : "password"} className="input input-bordered w-full pl-10"
                  placeholder="••••••••" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5 text-base-content/40" /> : <Eye className="h-5 w-5 text-base-content/40" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isLoggingIn}>
              {isLoggingIn ? <><Loader2 className="h-5 w-5 animate-spin" /> Loading...</> : "Log in to VibeTalk"}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Don’t have an account? <Link to="/signup" className="link link-primary">Join VibeTalk</Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title="Welcome Back to VibeTalk"
        subtitle="Jump back in and vibe with your people!"
        images={[image1, image2, image3, image4, image5, image6, image7, image8, image9]}
      />
    </div>
  );
};

export default LoginPage;
