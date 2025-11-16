import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Import images
import image1 from "../images/image1.jpeg";
import image2 from "../images/image2.jpeg";
import image3 from "../images/image3.jpeg";
import image4 from "../images/image4.jpeg";
import image5 from "../images/image5.jpeg";
import image6 from "../images/image6.jpeg";
import image7 from "../images/image7.jpeg";
import image8 from "../images/image8.jpeg";
import image9 from "../images/image9.jpeg";


// ⭐ Slideshow Component
const Slideshow = ({ images }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full relative">
      <img
        src={images[index]}
        className="w-full h-full object-cover animate-kenburns"
      />

      {/* Soft overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-base-300/40 to-transparent" />
    </div>
  );
};


const SignUpPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  // Form validation
  const validate = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return toast.error("Invalid email format");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const res = await signup(formData);
    if (res) navigate("/");
  };

  return (
    <div className="h-screen w-full grid lg:grid-cols-2 bg-base-200 text-base-content overflow-hidden">

      {/* LEFT SIDE FORM */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div
          className="
            w-full max-w-md
            rounded-3xl 
            bg-base-100 
            border border-base-300 
            shadow-xl 
            p-8 space-y-8
          "
        >
          <h1 className="text-2xl font-semibold text-center">
            Create Your Account
          </h1>
          <p className="text-center text-base-content/60 text-sm -mt-3 mb-6">
            Join VibeTalk and start chatting instantly.
          </p>

          {/* FORM */}
          <form onSubmit={submit} className="space-y-6">

            {/* Full Name */}
            <div>
              <label className="text-sm text-base-content/70">Full Name</label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-3 w-4 h-4 text-base-content/40" />
                <input
                  type="text"
                  className="w-full input input-bordered pl-11 bg-base-200"
                  placeholder="Your name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-base-content/70">Email</label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-base-content/40" />
                <input
                  type="email"
                  className="w-full input input-bordered pl-11 bg-base-200"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-base-content/70">Password</label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-base-content/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full input input-bordered pl-11 pr-10 bg-base-200"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-base-content/40"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSigningUp}
              className="btn btn-primary w-full rounded-lg flex items-center justify-center gap-2"
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </button>

          </form>

          {/* Footer */}
          <p className="text-center text-base-content/60 text-sm">
            Already have an account?{" "}
            <Link className="text-primary underline" to="/login">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE — SLIDESHOW BOX */}
      <div className="hidden lg:flex items-center justify-center p-10">
        <div
          className="
            w-[85%] h-[85%]
            rounded-3xl overflow-hidden 
            border border-base-300 bg-base-200
            shadow-xl relative
          "
        >
          <Slideshow
            images={[
              image1, image2, image3,
              image4, image5, image6,
              image7, image8, image9
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
