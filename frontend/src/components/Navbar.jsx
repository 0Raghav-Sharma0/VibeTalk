import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import lottie from "lottie-web";
import { defineElement } from "@lordicon/element";
import { LogOut, Settings, User } from "lucide-react";
import { motion } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";

defineElement(lottie.loadAnimation);

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="bg-base-200 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg shadow-lg transition-all">
      <div className="flex items-center justify-between h-16 px-6">
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition-all"
        >
          <lord-icon
            trigger="loop"
            src="/wired-flat-1369-chatting-hover-bounce.json"
            style={{ width: "50px", height: "50px" }}
          />
          <motion.h1
            className="font-[Outfit] text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Typewriter
              words={["VibeTalk"]}
              loop={1}
              cursor
              cursorStyle="|"
              typeSpeed={100}
            />
          </motion.h1>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/settings" className="btn btn-sm btn-outline gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          {authUser && (
            <>
              <Link to="/profile" className="btn btn-sm btn-outline gap-2">
                <User className="size-5" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <button
                className="btn btn-sm btn-error text-error-content gap-2"
                onClick={logout}
              >
                <LogOut className="size-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
