import React from 'react';
import {useState} from 'react';
import { useAuthStore } from '../store/useAuthStore';
import lottie from "lottie-web";
import { defineElement } from "@lordicon/element";
import { User, Lock, Mail, Eye, EyeOff} from 'lucide-react';
import 'ldrs/grid';
import { Link, Navigate } from 'react-router-dom';
import AuthImagePattern from '../components/AuthImagePattern';
import image1 from "../images/image1.jpeg";
import image2 from "../images/image2.jpeg";
import image3 from "../images/image3.jpeg";
import image4 from "../images/image4.jpeg";
import image5 from "../images/image5.jpeg";
import image6 from "../images/image6.jpeg";
import image7 from "../images/image7.jpeg";
import image8 from "../images/image8.jpeg";
import image9 from "../images/image9.jpeg";
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

defineElement(lottie.loadAnimation);


const SignUpPage = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);   
    const [formData, setFormData] = useState({
        fullName : "",
        email : "",
        password : "",
    });

    const {signup, isSigningUp} = useAuthStore();

    const validateForm = () => {
        if(!formData.fullName.trim()) return toast.error("Full name is required");
        if(!formData.email.trim()) return toast.error("Email is required");
        if(!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
        if(!formData.password) return toast.error("Password is required");
        if(formData.password.length < 6) return toast.error("Password must be at least 6 characters");

        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = validateForm();
    
        if (isValid) {
            const response = await signup(formData);
    
            if (response?.success) {
                navigate("/");
            }
        }
    };
    return (
        <div className ="min-h-screen grid lg:grid-cols-2">
            <div className = "flex flex-col justify-center items-center p-6 sm:p-12">
                <div className = "w-full max-w-md space-y-8">
                    
                    <div className = "text-center mb-8">
                        <div className = "flex flex-col items-center gap-2 group">
                            <div className = "w-24 h-24">
                                <lord-icon trigger="loop" src="/wired-flat-268-avatar-man-hover-glance.json" style={{ width: "100px", height: "100px" }}></lord-icon>
                            </div>
                            <h1 className="text-2xl font-bold mt-2">Create Account</h1>
                            <p className="text-base-content/60">Get Started with your Free Account</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Full Name</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="size-5 text-base-content/40" />
                                </div>
                                <input
                                    type="text"
                                    className={`input input-bordered w-full pl-10`}
                                    placeholder="Enter Your Name"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />  
                            </div>
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Email</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="size-5 text-base-content/40" />
                                </div>
                                <input
                                    type="email"
                                    className={`input input-bordered w-full pl-10`}
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Password</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="size-5 text-base-content/40" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`input input-bordered w-full pl-10`}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-5 text-base-content/40" />
                                        ) : (
                                        <Eye className="size-5 text-base-content/40" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary w-full"
                            disabled={isSigningUp}
                        >
                            {isSigningUp ? (
                            <>
                                <l-grid size="60" speed="1.5" color="white"></l-grid>
                                    Loading...
                            </>
                            ) : (
                            "Create Account"
                            )}
                        </button> 
                    </form>

                    <div className="text-center">
                        <p className="text-base-content/60">
                            Already have an account?{" "}
                            <Link to="/login" className="link link-primary">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
            <AuthImagePattern
                title="Join Our Community"
                subtitle="Less Noise, More Conversations – Your Chat, Your Way!"
                images={[
                    image1,
                    image2,
                    image3,
                    image4,
                    image5,
                    image6,
                    image7,
                    image8,
                    image9,
                ]}
            />  
        </div>
    )
}

export default SignUpPage