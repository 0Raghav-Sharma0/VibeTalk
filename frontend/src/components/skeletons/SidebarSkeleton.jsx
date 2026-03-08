const SidebarSkeleton = () => {
  const skeletonContacts = Array(6).fill(null);

  return (
    <aside className="h-full w-80 bg-base-100 border-r border-base-300/50 flex flex-col">
      <div className="px-4 py-4 border-b border-base-300/50">
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="skeleton h-4 w-20 mb-1" />
            <div className="skeleton h-3 w-14" />
          </div>
        </div>
        <div className="mt-3 flex gap-1">
          <div className="skeleton h-9 flex-1 rounded-lg" />
          <div className="skeleton h-9 flex-1 rounded-lg" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="skeleton h-4 w-24 mb-1" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;