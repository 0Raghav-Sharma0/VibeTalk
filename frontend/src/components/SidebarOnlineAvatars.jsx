import { memo } from "react";

const MAX_VISIBLE = 6;

function SidebarOnlineAvatars({ friends, overflow, onSelect }) {
  if (friends.length === 0) return null;

  return (
    <div className="px-1 pb-2">
      <p className="type-section text-gray-500 dark:text-white/60 px-2 mb-2">
        Online now
      </p>
      <div className="flex items-center gap-2 px-1 overflow-x-auto scrollbar-thin scrollbar-thumb-transparent">
        {friends.map((user) => (
          <button
            key={user._id}
            type="button"
            onClick={() => onSelect(user)}
            className="relative shrink-0 rounded-xl ring-2 ring-violet-200 dark:ring-violet-500/40 hover:ring-violet-400 dark:hover:ring-violet-400 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
            title={user.fullName || "Friend"}
          >
            <img
              src={user.profilePic || "/boy.png"}
              alt=""
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 dark:bg-emerald-400 rounded-full ring-2 ring-gray-100 dark:ring-[#0b0b0f]" />
          </button>
        ))}
        {overflow > 0 && (
          <div
            className="shrink-0 w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/25 flex items-center justify-center text-xs font-semibold text-violet-700 dark:text-violet-200 ring-2 ring-violet-200 dark:ring-violet-500/40"
            title={`${overflow} more online`}
          >
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}

export { MAX_VISIBLE };
export default memo(SidebarOnlineAvatars);
