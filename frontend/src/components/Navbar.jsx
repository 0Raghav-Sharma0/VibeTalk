import React from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { Link } from 'react-router-dom';
import lottie from "lottie-web";
import { defineElement } from "@lordicon/element";
import { LogOut, Settings, User } from 'lucide-react';
import { motion } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";

const Navbar = () => {
  const {logout, authUser} = useAuthStore();
  return (
    <header className="bg-[#191f25] border-b border-borderGray fixed w-full top-0 z-40 backdrop-blur-lg bg-darkCard/80 shadow-[0px_4px_10px_rgba(0,0,0,0.3)]">
  <div className="flex items-center justify-between h-16 px-6">
    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-all">
      <lord-icon 
        trigger="loop"
        src="/wired-flat-981-consultation-hover-conversation.json"
        style={{ width: "50px", height: "50px" }} 
      />
      <motion.h1
        className="font-[Inter] text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-4xl lg:text-4xl dark:text-white"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Typewriter words={["ChitChat"]} loop={1} cursor cursorStyle="|" typeSpeed={100} />
      </motion.h1>
    </Link>
    <div className="flex items-center gap-2">
      <Link to={"/settings"} className="btn btn-sm gap-2">
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Settings</span>
      </Link>

      {authUser && (
        <>
          <Link to={"/profile"} className="btn btn-sm gap-2">
            <User className="size-5" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
          <button className="flex gap-2 items-center" onClick={logout}>
            <LogOut className="size-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </>
      )}
    </div>
  </div>
</header>

  )
}

export default Navbar