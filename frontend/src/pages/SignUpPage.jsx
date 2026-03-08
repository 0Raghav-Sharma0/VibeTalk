import React, { useState, useEffect } from "react";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function SignUpPage() {
  const { signup, isSigningUp } = useAuthStore();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!document.getElementById("dotlottie-script")) {
      const script = document.createElement("script");
      script.id = "dotlottie-script";
      script.type = "module";
      script.src =
        "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";
      document.body.appendChild(script);
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || form.password.length < 6) {
      toast.error("Invalid details");
      return;
    }
    const ok = await signup(form);
    if (ok) navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-base-200 text-gray-900 dark:text-base-content flex overflow-hidden">

      {/* LEFT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md bg-white dark:bg-base-100 border border-transparent rounded-2xl p-8 shadow-xl overflow-hidden"
        >
          {/* subtle glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/15 blur-3xl rounded-full" />

          <div className="relative z-10 space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-base-content">
                Create Account
              </h1>
              <p className="text-sm text-gray-600 dark:text-base-content/60">
                Join and start chatting
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">

              {/* FULL NAME */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-base-content/70">
                  Full Name
                </label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    className="
                      w-full h-11 pl-10 pr-3 rounded-lg
                      bg-gray-100 dark:bg-base-200
                      border border-transparent
                      text-gray-900 dark:text-base-content
                      focus:outline-none focus:ring-2 focus:ring-primary/40
                    "
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-base-content/70">
                  Email
                </label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="
                      w-full h-11 pl-10 pr-3 rounded-lg
                      bg-gray-100 dark:bg-base-200
                      border border-transparent
                      text-gray-900 dark:text-base-content
                      focus:outline-none focus:ring-2 focus:ring-primary/40
                    "
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-base-content/70">
                  Password
                </label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={show ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="
                      w-full h-11 pl-10 pr-10 rounded-lg
                      bg-gray-100 dark:bg-base-200
                      border border-transparent
                      text-gray-900 dark:text-base-content
                      focus:outline-none focus:ring-2 focus:ring-primary/40
                    "
                  />
                  <button
                    type="button"
                    onClick={() => setShow((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* BUTTON */}
              <button
                disabled={isSigningUp}
                className="
                  w-full h-11 rounded-lg font-medium
                  bg-primary text-black
                  hover:bg-primary/90
                  transition flex items-center justify-center
                "
              >
                {isSigningUp ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Sign Up"
                )}
              </button>
            </form>

            <p className="text-sm text-center text-gray-600 dark:text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* RIGHT */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gray-50 dark:bg-base-200">
        <dotlottie-player
          src="https://lottie.host/5a4c9f68-0a91-4373-83ba-809e7d1ced57/rlqClPNnCc.lottie"
          background="transparent"
          speed="1"
          loop
          autoplay
          style={{ width: 420, height: 420 }}
        />
      </div>
    </div>
  );
}
