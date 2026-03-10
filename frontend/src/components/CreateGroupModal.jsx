import { useState } from "react";
import { X, Users, Check } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const CreateGroupModal = ({ onClose }) => {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { createGroup, getGroups } = useGroupStore();
  const { users } = useChatStore();
  const { authUser } = useAuthStore();

  const friends = users.filter((u) => u._id !== authUser?._id);

  const toggleMember = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const group = await createGroup(name.trim(), Array.from(selectedIds));
    if (group) {
      getGroups();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl dark-mode-bg dark:border-white/10 shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-transparent">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-white/10">
              <Users className="w-5 h-5 text-[#7D3DCF] dark:text-[#b29bff]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Group</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors outline-none focus:outline-none text-gray-700 dark:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-white/80 mb-2">Group name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-white/80 mb-2">
              Add members (friends only)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl border-2 border-gray-200 dark:border-white/20 p-2">
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-white/50 py-4 text-center">No friends to add</p>
              ) : (
                friends.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => toggleMember(u._id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${
                      selectedIds.has(u._id)
                        ? "bg-violet-100 dark:bg-white/20 border-2 border-violet-300 dark:border-violet-500/50"
                        : "hover:bg-gray-100 dark:hover:bg-white/10 border-2 border-transparent"
                    }`}
                  >
                    <img
                      src={u.profilePic || "/boy.png"}
                      alt=""
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                    <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">
                      {u.fullName}
                    </span>
                    {selectedIds.has(u._id) && (
                      <Check className="w-5 h-5 text-[#7D3DCF] dark:text-[#b29bff]" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-xl font-semibold bg-[#7D3DCF] text-white disabled:opacity-50 hover:bg-[#9C66CC] dark:hover:bg-[#9C66CC] transition-colors"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
