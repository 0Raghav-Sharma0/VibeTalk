import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Mail, User, Camera, Edit2, Save, X } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();

  // Local state
  const [preview, setPreview] = useState(authUser.profilePic || null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(authUser.fullName);

  // ------------------------------------------
  // Upload Profile Picture
  // ------------------------------------------
  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      const img = reader.result;
      setPreview(img);

      await updateProfile({ profilePic: img });
      toast.success("Profile photo updated!");
    };

    reader.readAsDataURL(file);
  };

  // ------------------------------------------
  // Save edited name
  // ------------------------------------------
  const saveName = async () => {
    if (!nameValue.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (nameValue === authUser.fullName) {
      setIsEditingName(false);
      return;
    }

    await updateProfile({ fullName: nameValue });
    toast.success("Name updated successfully!");
    setIsEditingName(false);
  };

  return (
    <div className="h-full w-full bg-base-200 text-base-content overflow-y-auto py-16 px-6 flex justify-center">
      <div className="w-full max-w-2xl space-y-10">

        {/* TITLE */}
        <div>
          <h1 className="text-2xl font-semibold">Your Profile</h1>
          <p className="text-base-content/60 text-sm mt-1">
            Manage your account and appearance.
          </p>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-base-100 border border-base-300 rounded-xl p-6">

          {/* AVATAR */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border border-base-300 bg-base-300">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-base-300" />
              )}

              <label
                htmlFor="avatar"
                className="
                  absolute bottom-2 right-2 
                  w-9 h-9 rounded-full 
                  bg-base-100/70 backdrop-blur-md 
                  border border-base-300 
                  flex items-center justify-center 
                  text-base-content/70 hover:text-base-content
                  hover:bg-base-100 cursor-pointer transition
                "
              >
                <Camera size={18} />
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUpdatingProfile}
                  onChange={uploadImage}
                />
              </label>
            </div>

            <p className="text-xs text-base-content/60">
              {isUpdatingProfile ? "Updating..." : "Tap the camera to change photo"}
            </p>
          </div>

          {/* DETAILS */}
          <div className="space-y-6">

            {/* FULL NAME */}
            <div>
              <label className="text-xs text-base-content/60 flex items-center gap-2">
                <User size={16} /> Full Name
              </label>

              <div className="mt-2 flex items-center gap-3">
                {isEditingName ? (
                  <>
                    <input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="
                        py-2.5 px-3 rounded-lg 
                        bg-base-200 border border-base-300 
                        w-full outline-none focus:border-primary
                      "
                    />

                    <button
                      onClick={saveName}
                      className="p-2 rounded-lg bg-primary text-primary-content hover:bg-primary/80 transition"
                    >
                      <Save size={18} />
                    </button>

                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setNameValue(authUser.fullName);
                      }}
                      className="p-2 rounded-lg bg-base-200 border border-base-300 hover:bg-base-300 transition"
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <p
                      className="
                        py-2.5 px-3 rounded-lg 
                        bg-base-200 border border-base-300 flex-1
                      "
                    >
                      {authUser.fullName}
                    </p>

                    <button
                      onClick={() => setIsEditingName(true)}
                      className="
                        p-2 rounded-lg bg-base-200 border border-base-300 
                        hover:bg-base-300 transition
                      "
                    >
                      <Edit2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-xs text-base-content/60 flex items-center gap-2">
                <Mail size={16} /> Email
              </label>

              <p
                className="
                  mt-2 py-2.5 px-3 rounded-lg 
                  bg-base-200 border border-base-300
                "
              >
                {authUser.email}
              </p>
            </div>

          </div>
        </div>

        {/* ACCOUNT INFO */}
        <div className="bg-base-100 border border-base-300 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-medium">Account Details</h2>

          <div className="flex justify-between py-2 border-b border-base-300 text-sm">
            <span className="text-base-content/60">Member Since</span>
            <span className="text-base-content">
              {authUser.createdAt?.split("T")[0]}
            </span>
          </div>

          <div className="flex justify-between py-2 text-sm">
            <span className="text-base-content/60">Status</span>
            <span className="text-success font-medium">Active</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
