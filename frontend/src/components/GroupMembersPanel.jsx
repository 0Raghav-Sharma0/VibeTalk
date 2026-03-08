import { useState } from "react";
import { X, UserPlus, Users } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const toStr = (id) => (id?.toString?.() || String(id || ""));

export default function GroupMembersPanel({ group, onClose }) {
  const [showAdd, setShowAdd] = useState(false);
  const { addMember, removeMember } = useGroupStore();
  const { users } = useChatStore();
  const { authUser } = useAuthStore();

  const isAdmin = group?.members?.some(
    (m) => toStr(m.userId?._id || m.userId) === toStr(authUser?._id) && m.role === "admin"
  );

  const memberIds = new Set(
    group?.members?.map((m) => toStr(m.userId?._id || m.userId)) || []
  );
  const friendsToAdd = users.filter(
    (u) => u._id !== authUser?._id && !memberIds.has(toStr(u._id))
  );

  const handleAdd = async (userId) => {
    const ok = await addMember(group._id, userId);
    if (ok) setShowAdd(false);
  };

  const handleRemove = async (userId) => {
    await removeMember(group._id, userId);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-base-100 shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-transparent">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-gray-900 dark:text-base-content">Group Members</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {group?.members?.map((m) => {
            const u = m.userId;
            const id = u?._id || u;
            const isMe = toStr(id) === toStr(authUser?._id);
            const canRemove = isAdmin && !isMe;

            return (
              <div
                key={toStr(id)}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-base-200/60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={u?.profilePic || "/boy.png"}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-base-content truncate">
                      {u?.fullName || "Unknown"}
                      {isMe && " (You)"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-base-content/60">
                      {m.role === "admin" ? "Admin" : "Member"}
                    </p>
                  </div>
                </div>
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => handleRemove(id)}
                    className="text-xs px-3 py-1.5 rounded-lg text-error hover:bg-error/10 font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}

          {isAdmin && (
            <div className="pt-2">
              {showAdd ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 dark:text-base-content/60">
                    Add a friend
                  </p>
                  {friendsToAdd.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">No friends to add</p>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {friendsToAdd.map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => handleAdd(u._id)}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-primary/10 transition-colors text-left"
                        >
                          <img
                            src={u.profilePic || "/boy.png"}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover"
                          />
                          <span className="flex-1 text-sm font-medium">{u.fullName}</span>
                          <UserPlus className="w-4 h-4 text-primary" />
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="text-sm text-gray-600 dark:text-base-content/60 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/15 text-primary border-2 border-dashed border-primary/30 font-semibold hover:bg-primary/20 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  Add Member
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
