import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import {
  LogOut,
  Settings,
  User,
  MessageSquare,
  Users,
  Film,
} from "lucide-react";

const Navbar = ({ onOpenSidebar }) => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="fixed top-0 w-full z-40 bg-white dark:bg-base-100 border-b border-gray-200 dark:border-base-300">
      <div className="flex items-center justify-between h-14 px-3 sm:px-6">

        {/* ================= LEFT ================= */}
        <div className="flex items-center gap-3">
          {/* Mobile sidebar */}
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200 transition"
          >
            <Users className="w-5 h-5 text-gray-800 dark:text-base-content" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 select-none">
            <MessageSquare className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-base-content">
              VibeTalk
            </span>
          </Link>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-1 sm:gap-2">

          {/* WATCH PARTY */}
          <Link
            to="/watch-party"
            className="
              flex items-center gap-2
              px-2 sm:px-3 py-1.5
              rounded-lg text-sm font-medium
              bg-primary/15 text-primary
              border border-primary/30
              hover:bg-primary/25
              transition
            "
          >
            <Film className="w-4 h-4" />
            <span className="hidden sm:inline">Watch Party</span>
          </Link>

          {/* SETTINGS */}
          <Link
            to="/settings"
            className="
              flex items-center gap-2
              px-2 sm:px-3 py-1.5
              rounded-lg text-sm
              bg-gray-100 dark:bg-base-200
              border border-gray-300 dark:border-base-300
              text-gray-800 dark:text-base-content
              hover:border-primary/40 hover:text-primary
              transition
            "
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          {authUser && (
            <>
              {/* PROFILE */}
              <Link
                to="/profile"
                className="
                  flex items-center gap-2
                  px-2 sm:px-3 py-1.5
                  rounded-lg text-sm
                  bg-gray-100 dark:bg-base-200
                  border border-gray-300 dark:border-base-300
                  text-gray-800 dark:text-base-content
                  hover:border-secondary/40 hover:text-secondary
                  transition
                "
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>

              {/* LOGOUT */}
              <button
                onClick={logout}
                className="
                  flex items-center gap-2
                  px-2 sm:px-3 py-1.5
                  rounded-lg text-sm font-medium
                  bg-red-50 text-red-600
                  border border-red-200
                  hover:bg-red-600 hover:text-white
                  transition
                "
              >
                <LogOut className="w-4 h-4" />
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
