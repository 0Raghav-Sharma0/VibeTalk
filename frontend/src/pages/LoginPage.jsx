import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

// slideshow component
import AuthSlideshow from "../components/AuthSlideshow";

// images
import image1 from "../images/image1.jpeg";
import image2 from "../images/image2.jpeg";
import image3 from "../images/image3.jpeg";
import image4 from "../images/image4.jpeg";
import image5 from "../images/image5.jpeg";
import image6 from "../images/image6.jpeg";
import image7 from "../images/image7.jpeg";
import image8 from "../images/image8.jpeg";
import image9 from "../images/image9.jpeg";

const images = [
  image1, image2, image3,
  image4, image5, image6,
  image7, image8, image9
];

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    await login(form);
  };

  return (
    <div className="h-screen w-full grid lg:grid-cols-2 bg-base-200 text-base-content overflow-hidden">

      {/* LEFT — FORM */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div
          className="
            w-full max-w-md 
            rounded-3xl bg-base-100 
            border border-base-300 
            shadow-xl p-8 space-y-8
          "
        >
          <h1 className="text-2xl font-semibold text-center">Welcome Back</h1>
          <p className="text-center text-base-content/60 text-sm -mt-3 mb-6">
            Log in to continue your conversations.
          </p>

          {/* FORM */}
          <form onSubmit={submit} className="space-y-6">

            {/* Email */}
            <div>
              <label className="text-sm text-base-content/70">Email</label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-base-content/40" />

                <input
                  type="email"
                  className="input input-bordered w-full pl-11 bg-base-200"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
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
                  className="input input-bordered w-full pl-11 pr-10 bg-base-200"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
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
              disabled={isLoggingIn}
              className="btn btn-primary w-full rounded-lg flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <p className="text-center text-base-content/60 text-sm">
            Don’t have an account?{" "}
            <Link className="text-primary underline" to="/signup">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT — FIXED SLIDESHOW BOX */}
      <div className="hidden lg:flex items-center justify-center p-10">
        <div
          className="
            w-[85%]
            h-[520px]          /* Same height as signup */
            rounded-3xl overflow-hidden
            border border-base-300 bg-base-200 shadow-xl
          "
        >
          <AuthSlideshow images={images} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
