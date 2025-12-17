import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function LoginPage() {
  const { login, isLoggingIn } = useAuthStore();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  /* ✅ REGISTER dotLottie WEB COMPONENT */
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

  const submit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Fill all fields");
      return;
    }
    login(form);
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex overflow-hidden">

      {/* LEFT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6">
        <motion.div
          variants={rise}
          initial="hidden"
          animate="show"
          className="relative w-full max-w-md bg-base-100 border border-base-300 rounded-2xl p-8 shadow-xl overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 blur-3xl rounded-full" />

          <div className="relative z-10 space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-semibold">Welcome Back</h1>
              <p className="text-sm text-base-content/60">
                Sign in to continue
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">

              <div>
                <label className="text-xs text-base-content/60">Email</label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full h-11 pl-10 pr-3 rounded-lg bg-base-200 border border-base-300 focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-base-content/60">Password</label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                  <input
                    type={show ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full h-11 pl-10 pr-10 rounded-lg bg-base-200 border border-base-300 focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60"
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                disabled={isLoggingIn}
                className="w-full h-11 bg-primary text-primary-content rounded-lg flex items-center justify-center"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : "Log In"}
              </button>
            </form>

            <p className="text-sm text-center text-base-content/60">
              Don’t have an account?{" "}
              <Link to="/signup" className="text-primary font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* RIGHT */}
      <div className="hidden lg:flex w-1/2 items-center justify-center">
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
