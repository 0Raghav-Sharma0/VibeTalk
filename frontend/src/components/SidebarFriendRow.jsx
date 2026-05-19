import { memo } from "react";
import { Pin, PinOff, X } from "lucide-react";

function SidebarFriendRow({
  user,
  isSelected,
  isOnline,
  isPinned,
  unread,
  isTyping,
  onSelect,
  onRemove,
  onTogglePin,
}) {
  return (
    <div
      className={`relative rounded-xl group transition-colors duration-200 overflow-hidden
        ${
          isSelected
            ? "bg-[#EEECF9] sidebar-friend-selected ring-1 ring-[#7D3DCF]/30 dark:ring-transparent"
            : unread
              ? "bg-violet-50 dark-item ring-1 ring-violet-200/50 dark:ring-violet-500/20"
              : "bg-gray-100/80 dark-item hover:bg-gray-200"
        }
      `}
    >
      {isSelected && (
        <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#7D3DCF] dark:bg-violet-400 rounded-r-full" />
      )}

      <div
        onClick={onSelect}
        className="relative flex items-center gap-2.5 px-3 py-2.5 cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect()}
      >
        <div className="relative shrink-0">
          <div
            className={`rounded-xl overflow-hidden ring-2 ${
              isSelected
                ? "ring-[#7D3DCF] dark:ring-violet-500"
                : "ring-violet-200 dark:ring-violet-500/40"
            }`}
          >
            <img
              src={user.profilePic || "/boy.png"}
              alt={user.fullName}
              className="w-9 h-9 object-cover"
            />
          </div>
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 dark:bg-emerald-400 online-indicator-glow rounded-full ring-2 ring-gray-100 dark:ring-[#0b0b0f]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <p
              className={`text-sm truncate font-medium ${
                isSelected
                  ? "text-[#7D3DCF] dark:text-violet-400"
                  : unread && !isSelected
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-900 dark:text-white"
              }`}
            >
              {user.fullName || "Unknown User"}
            </p>
            {isTyping && (
              <span className="text-xs text-[#7D3DCF] dark:text-violet-400 font-medium animate-pulse shrink-0">
                typing
              </span>
            )}
          </div>

          <p
            className={`text-xs font-normal ${
              isSelected
                ? "text-[#9C66CC] dark:text-violet-400/90"
                : isOnline
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-gray-500 dark:text-white/70"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>

        {unread > 0 && !isSelected && (
          <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs rounded-lg bg-violet-500 dark:bg-white text-white dark:text-black font-semibold shrink-0">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin?.();
          }}
          className={`p-1.5 rounded-lg transition-all outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
            isPinned
              ? "text-violet-600 dark:text-violet-300 bg-violet-100/80 dark:bg-violet-500/20"
              : "text-gray-500 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10"
          }`}
          title={isPinned ? "Unpin" : "Pin"}
        >
          {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 rounded-lg hover:bg-error/20 text-error/80 hover:text-error transition-all outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
          title="Remove friend"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function propsAreEqual(prev, next) {
  return (
    prev.isSelected === next.isSelected &&
    prev.isOnline === next.isOnline &&
    prev.isPinned === next.isPinned &&
    prev.unread === next.unread &&
    prev.isTyping === next.isTyping &&
    prev.user._id === next.user._id &&
    prev.user.fullName === next.user.fullName &&
    prev.user.profilePic === next.user.profilePic
  );
}

export default memo(SidebarFriendRow, propsAreEqual);
