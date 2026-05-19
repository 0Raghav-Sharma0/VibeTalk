import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

function ProfilePanel() {
  const authUser = useAuthStore((s) => s.authUser);
  const patchAuthUser = useAuthStore((s) => s.patchAuthUser);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [fullName, setFullName] = useState("");
  const [about, setAbout] = useState("");
  const [previewPic, setPreviewPic] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileRef = useRef(null);
  const syncedIdRef = useRef(null);

  useEffect(() => {
    if (!authUser?._id) return;
    if (syncedIdRef.current === authUser._id) return;
    syncedIdRef.current = authUser._id;
    setFullName(authUser.fullName || "");
    setAbout(authUser.about || "");
    setPreviewPic(authUser.profilePic || "");
  }, [authUser?._id, authUser?.fullName, authUser?.about, authUser?.profilePic]);

  const handleSave = useCallback(async () => {
    if (!authUser || saving) return;
    const name = fullName.trim();
    if (!name) return;

    const prev = { fullName: authUser.fullName, about: authUser.about };
    patchAuthUser({ fullName: name, about: about.trim() });

    setSaving(true);
    try {
      await updateProfile(
        { fullName: name, about: about.trim() },
        { silent: false }
      );
    } catch {
      patchAuthUser(prev);
      setFullName(prev.fullName || "");
      setAbout(prev.about || "");
    } finally {
      setSaving(false);
    }
  }, [authUser, about, fullName, patchAuthUser, saving, updateProfile]);

  const handleImagePick = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !authUser) return;
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        const prevPic = authUser.profilePic;
        setPreviewPic(dataUrl);
        patchAuthUser({ profilePic: dataUrl });
        setUploadingPic(true);
        try {
          const updated = await updateProfile({ profilePic: dataUrl }, { silent: true });
          setPreviewPic(updated.profilePic || dataUrl);
        } catch {
          setPreviewPic(prevPic || "");
          patchAuthUser({ profilePic: prevPic });
        } finally {
          setUploadingPic(false);
        }
      };
      reader.readAsDataURL(file);
    },
    [authUser, patchAuthUser, updateProfile]
  );

  if (!authUser) return null;

  const dirty =
    fullName.trim() !== (authUser.fullName || "") ||
    about.trim() !== (authUser.about || "");

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark-item shadow-sm p-5 space-y-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploadingPic}
          className="relative shrink-0 rounded-2xl overflow-hidden ring-2 ring-violet-200 dark:ring-violet-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
          aria-label="Change profile photo"
        >
          <img
            src={previewPic || "/boy.png"}
            alt=""
            className="w-20 h-20 object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 hover:opacity-100 transition-opacity">
            {uploadingPic ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImagePick}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {authUser.fullName || "Your profile"}
          </p>
          <p className="text-xs text-gray-600 dark:text-white/70 font-medium truncate mt-0.5">
            {authUser.email}
          </p>
          <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
            Tap photo to change — saves automatically
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-gray-700 dark:text-white/80">
            Display name
          </span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 border border-transparent text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            maxLength={80}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-700 dark:text-white/80">About</span>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            className="mt-1 w-full px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 border border-transparent text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            maxLength={280}
            placeholder="Say something about yourself"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !dirty || !fullName.trim()}
        className="w-full py-2.5 rounded-xl bg-violet-500 dark:bg-violet-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-violet-600 dark:hover:bg-violet-500 transition-colors"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Save changes
      </button>
    </section>
  );
}

export default memo(ProfilePanel);
