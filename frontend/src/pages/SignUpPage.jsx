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
    <div className="min-h-screen bg-base-200 text-base-content flex overflow-hidden">

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md bg-base-100 border border-base-300 rounded-2xl p-8 shadow-xl overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 blur-3xl rounded-full" />

          <div className="relative z-10 space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-semibold">Create Account</h1>
              <p className="text-sm text-base-content/60">
                Join and start chatting
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">

              <div>
                <label className="text-xs text-base-content/60">
                  Full Name
                </label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                  <input
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    className="w-full h-11 pl-10 rounded-lg bg-base-200 border border-base-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-base-content/60">Email</label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full h-11 pl-10 rounded-lg bg-base-200 border border-base-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-base-content/60">
                  Password
                </label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                  <input
                    type={show ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full h-11 pl-10 pr-10 rounded-lg bg-base-200 border border-base-300"
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
                disabled={isSigningUp}
                className="w-full h-11 bg-primary text-primary-content rounded-lg flex items-center justify-center"
              >
                {isSigningUp ? <Loader2 className="animate-spin" /> : "Sign Up"}
              </button>
            </form>

            <p className="text-sm text-center text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium">
                Log In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

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
