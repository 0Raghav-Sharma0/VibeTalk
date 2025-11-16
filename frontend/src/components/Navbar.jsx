import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { LogOut, Settings, User, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="fixed top-0 w-full z-40 bg-base-100 border-b border-base-300/80">
      <div className="flex items-center justify-between h-14 px-6">

        {/* LEFT: Logo + Title */}
        <Link to="/" className="flex items-center gap-3 select-none">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MessageSquare className="w-7 h-7 text-primary" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-xl font-semibold tracking-tight text-base-content"
          >
            VibeTalk
          </motion.h1>
        </Link>

        {/* RIGHT BUTTONS */}
        <div className="flex items-center gap-3">

          {/* SETTINGS */}
          <Link
            to="/settings"
            className="
              px-3 py-1.5 rounded-md text-sm
              bg-base-200 border border-base-300
              text-base-content/70 hover:text-primary hover:border-primary/50
              transition
            "
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </div>
          </Link>

          {/* PROFILE + LOGOUT */}
          {authUser && (
            <>
              {/* PROFILE */}
              <Link
                to="/profile"
                className="
                  px-3 py-1.5 rounded-md text-sm
                  bg-base-200 border border-base-300
                  text-base-content/70 hover:text-secondary hover:border-secondary/50
                  transition
                "
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </div>
              </Link>

              {/* LOGOUT */}
              <button
                onClick={logout}
                className="
                  px-3 py-1.5 rounded-md text-sm
                  bg-error/10 border border-error/40 text-error
                  hover:bg-error hover:text-error-content hover:border-error
                  transition
                "
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </div>
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
