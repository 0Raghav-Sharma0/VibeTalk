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
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-base-100 shadow-xl border border-gray-200/40 dark:border-base-300/20 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/80 dark:border-base-300/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/15">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-base-content">Create Group</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200 transition-colors outline-none focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-base-content/80 mb-2">Group name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200/40 dark:border-base-300/20 bg-white dark:bg-base-100 text-gray-900 dark:text-base-content placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-base-content/80 mb-2">
              Add members (friends only)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl border-2 border-gray-200/40 dark:border-base-300/20 p-2">
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-base-content/50 py-4 text-center">No friends to add</p>
              ) : (
                friends.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => toggleMember(u._id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${
                      selectedIds.has(u._id)
                        ? "bg-primary/15 border-2 border-primary/30"
                        : "hover:bg-gray-100 dark:hover:bg-base-200 border-2 border-transparent"
                    }`}
                  >
                    <img
                      src={u.profilePic || "/boy.png"}
                      alt=""
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                    <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-base-content">
                      {u.fullName}
                    </span>
                    {selectedIds.has(u._id) && (
                      <Check className="w-5 h-5 text-primary" />
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
              className="flex-1 py-3 rounded-xl font-semibold text-gray-700 dark:text-base-content/70 hover:bg-gray-100 dark:hover:bg-base-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-xl font-semibold bg-primary text-gray-900 disabled:opacity-50 hover:opacity-90 transition-opacity"
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
