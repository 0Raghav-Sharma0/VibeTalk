/** Profile card pinned at the bottom of the sidebar / mobile drawer */
export default function SidebarUserFooter({ authUser, className = "" }) {
  if (!authUser) return null;

  return (
    <footer
      className={`sidebar-footer shrink-0 border-t border-gray-200 dark:border-white/20 ${className}`.trim()}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5 mx-2 my-2 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 min-w-0">
        <div className="relative shrink-0">
          <img
            src={authUser.profilePic || "/boy.png"}
            alt="You"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover ring-2 ring-violet-500/30"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#0b0b0f]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
            {authUser.fullName || "You"}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold truncate">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
            Online
          </p>
        </div>
      </div>
    </footer>
  );
}
