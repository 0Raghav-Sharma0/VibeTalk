import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Edit2, Save, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";

import profileAnimation from "../profile.lottie.json";

export default function ProfilePage() {
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(authUser?.fullName || "");

  if (!authUser) return null;

  const avatarSrc = authUser.profilePic || "/boy.png";

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      await updateProfile({ profilePic: reader.result });
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(file);
  };

  const saveName = async () => {
    if (!name.trim()) return;
    await updateProfile({ fullName: name });
    toast.success("Name updated");
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <Navbar />

      {/* ================= MAIN ================= */}
      <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2">

        {/* ================= LEFT (PROFILE) ================= */}
        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md space-y-8 text-center">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden border border-base-300 bg-base-300">
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                <label
                  htmlFor="avatar"
                  className="
                    absolute bottom-1 right-1
                    w-8 h-8 rounded-full
                    bg-primary text-black
                    flex items-center justify-center
                    cursor-pointer
                    shadow
                  "
                >
                  <Camera size={14} />
                  <input
                    id="avatar"
                    type="file"
                    hidden
                    onChange={uploadImage}
                    disabled={isUpdatingProfile}
                  />
                </label>
              </div>

              <h1 className="text-2xl font-semibold text-primary">
                {authUser.fullName}
              </h1>
              <p className="text-sm text-base-content/60">
                {authUser.email}
              </p>
            </div>

            {/* Name Card */}
            <div className="bg-base-100/80 backdrop-blur border border-base-300 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wide text-base-content/50 mb-2">
                Display Name
              </p>

              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="
                        flex-1 px-4 py-2 rounded-xl
                        bg-base-200 border border-base-300
                        outline-none
                      "
                    />
                    <button
                      onClick={saveName}
                      className="p-2 bg-primary text-black rounded-xl"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setName(authUser.fullName);
                      }}
                      className="p-2 border border-base-300 rounded-xl"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className="
                        flex-1 px-4 py-2 rounded-xl
                        bg-base-200 border border-base-300
                        font-medium text-primary
                      "
                    >
                      {authUser.fullName}
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="p-2 border border-base-300 rounded-xl"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-xs text-base-content/50">
              Your profile info is visible to people you chat with
            </p>
          </div>
        </div>

        {/* ================= RIGHT (ILLUSTRATION) ================= */}
        <div className="hidden lg:flex items-center justify-center bg-base-200">
          <Lottie
            animationData={profileAnimation}
            loop
            autoplay
            className="w-[360px] opacity-80"
          />
        </div>
      </div>
    </div>
  );
}
