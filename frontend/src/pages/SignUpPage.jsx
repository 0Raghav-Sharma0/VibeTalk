import React, { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
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

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signup, isSigningUp } = useAuthStore();

  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const validate = () => {
    if (!form.fullName.trim()) return toast.error("Full name required");
    if (!form.email.trim()) return toast.error("Email required");
    if (!/\S+@\S+\.\S+/.test(form.email))
      return toast.error("Enter valid email");
    if (form.password.length < 6)
      return toast.error("Password must be 6+ characters");
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const ok = await signup(form);
    if (ok) navigate("/");
  };

  return (
    <div className="h-screen w-full grid lg:grid-cols-2 bg-base-200 overflow-hidden">

      {/* LEFT — SIGNUP FORM */}
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-2xl shadow-2xl p-8 space-y-8">

          <h1 className="text-3xl font-bold text-center">Create Account</h1>
          <p className="text-center text-base-content/60">
            Join VibeTalk and start chatting instantly.
          </p>

          <form className="space-y-6" onSubmit={submit}>

            {/* FULL NAME */}
            <div>
              <label>Full Name</label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-3 w-5 h-5 text-base-content/40" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  placeholder="Your name"
                  className="input input-bordered w-full pl-12 bg-base-200"
                />
              </div>
            </div>

            {/* EMAIL */}
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
                  placeholder="you@example.com"
                  className="input input-bordered w-full pl-12 bg-base-200"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label>Password</label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-base-content/40" />

                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-12 pr-12 bg-base-200"
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3 text-base-content/50"
                >
                  {showPass ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={isSigningUp}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" /> Creating...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-base-content/60">
            Already have an account?{" "}
            <Link to="/login" className="text-primary">
              Log In
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT — IMAGE PANEL */}
      <div className="hidden lg:flex h-full w-full p-10">
        <AuthSlideshow
          images={[
            img1, img2, img3,
            img4, img5, img6,
            img7, img8, img9,
          ]}
        />
      </div>

    </div>
  );
};

export default SignUpPage;
