// LoginPage.jsx
import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import AuthSlideshow from "../components/AuthSlideshow";

// IMAGES
import img1 from "../images/image1.jpeg";
import img2 from "../images/image2.jpeg";
import img3 from "../images/image3.jpeg";
import img4 from "../images/image4.jpeg";
import img5 from "../images/image5.jpeg";
import img6 from "../images/image6.jpeg";
import img7 from "../images/image7.jpeg";
import img8 from "../images/image8.jpeg";
import img9 from "../images/image9.jpeg";

const LoginPage = () => {
  const { login, isLoggingIn } = useAuthStore();
  const [show, setShow] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Fill all fields");
    login(form);
  };

  return (
    <div className="h-screen w-full grid lg:grid-cols-2 bg-base-200 overflow-hidden">

      {/* LEFT */}
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-2xl shadow-2xl p-8 space-y-8">

          <h1 className="text-3xl font-bold text-center">Welcome Back</h1>
          <p className="text-center text-base-content/60">
            Log in to continue your conversations.
          </p>

          {/* FORM */}
          <form className="space-y-6" onSubmit={submit}>

            {/* Email */}
            <div>
              <label>Email</label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-base-content/40" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="input input-bordered w-full pl-12 bg-base-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label>Password</label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-base-content/40" />
                <input
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="input input-bordered w-full pl-12 pr-12 bg-base-200"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-3 text-base-content/40"
                >
                  {show ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary w-full" disabled={isLoggingIn}>
              {isLoggingIn ? <Loader2 className="animate-spin" /> : "Log In"}
            </button>
          </form>

          <p className="text-center text-base-content/60">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary">Sign Up</Link>
          </p>
        </div>
      </div>

      {/* RIGHT PANEL → FIXED HEIGHT + FULL IMAGE FROM TOP */}
      <div className="hidden lg:flex h-full w-full p-10">
        <AuthSlideshow
          images={[img1, img2, img3, img4, img5, img6, img7, img8, img9]}
        />
      </div>

    </div>
  );
};

export default LoginPage;
