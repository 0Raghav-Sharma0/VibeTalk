import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

// ALL IMAGES
import image1 from "../images/image1.jpeg";
import image2 from "../images/image2.jpeg";
import image3 from "../images/image3.jpeg";
import image4 from "../images/image4.jpeg";
import image5 from "../images/image5.jpeg";
import image6 from "../images/image6.jpeg";
import image7 from "../images/image7.jpeg";
import image8 from "../images/image8.jpeg";
import image9 from "../images/image9.jpeg";


// ⭐ Slideshow component (perfectly reusable)
const Slideshow = ({ images }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      3500
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <img
        src={images[index]}
        className="w-full h-full object-cover animate-kenburns"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-base-300/40 to-transparent" />
    </div>
  );
};


const LoginPage = () => {
  const { login, isLoggingIn } = useAuthStore();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password)
      return toast.error("Enter your email & password");

    await login(form);
  };

  return (
    <div className="h-screen w-full grid lg:grid-cols-2 bg-base-200 text-base-content overflow-hidden">

      {/* LEFT — LOGIN CARD */}
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
          <h1 className="text-3xl font-bold text-center">
            Welcome Back
          </h1>

          <p className="text-center text-base-content/60">
            Log in to continue your conversations.
          </p>

          {/* FORM */}
          <form className="space-y-6" onSubmit={submit}>
            
            {/* EMAIL */}
            <div>
              <label className="text-sm text-base-content/70">Email</label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-base-content/40" />

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="you@example.com"
                  className="
                    input input-bordered w-full pl-12 bg-base-200
                  "
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm text-base-content/70">Password</label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-base-content/40" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="
                    input input-bordered w-full pl-12 pr-12 bg-base-200
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-base-content/40 hover:text-base-content/70"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="
                btn btn-primary w-full rounded-lg 
                flex items-center justify-center gap-2
              "
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-sm text-center text-base-content/70">
            Don’t have an account?
            <Link to="/signup" className="text-primary ml-1 underline">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT — SLIDESHOW BOX */}
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
              image7, image8, image9,
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
