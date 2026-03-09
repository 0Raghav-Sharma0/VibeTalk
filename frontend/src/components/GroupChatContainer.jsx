import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Users, Search } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import MessageBubble from "./MessageBubble";
import GroupMessageInput from "./GroupMessageInput";
import GroupMembersPanel from "./GroupMembersPanel";

const toStr = (id) => (id?.toString?.() || String(id || ""));

export default function GroupChatContainer() {
  const { selectedGroup, groupMessages, setSelectedGroup, isGroupMessagesLoading, leaveGroup } = useGroupStore();
  const { authUser } = useAuthStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const endRef = useRef(null);

  const isAdmin = selectedGroup?.members?.some(
    (m) => toStr(m.userId?._id || m.userId) === toStr(authUser?._id) && m.role === "admin"
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages.length]);

  const filteredMessages = searchQuery
    ? groupMessages.filter((m) =>
        m.text?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : groupMessages;

  if (!selectedGroup) return null;

  return (
    <div className="h-full min-h-0 flex flex-col bg-white dark:bg-[#1e1c24]">
      {/* HEADER */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-3 border-b border-transparent flex items-center justify-between bg-white dark:bg-[#1e1c24] dark:border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedGroup(null)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-violet-100 dark:bg-white/10">
            <Users className="w-6 h-6 text-violet-600 dark:text-[#b29bff]" />
          </div>

          <button
            onClick={() => setShowMembers(true)}
            className="text-left min-w-0"
          >
            <h2 className="font-semibold text-gray-900 dark:text-violet-400 truncate">
              {selectedGroup.name}
            </h2>
            <p className="text-xs text-gray-600 dark:text-violet-400/80">
              {selectedGroup.members?.length || 0} members
              {isAdmin && " · You are admin"}
            </p>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200"
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => leaveGroup(selectedGroup._id)}
            className="text-xs px-3 py-1.5 rounded-lg text-error hover:bg-error/10 font-medium"
          >
            Leave
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="flex-shrink-0 px-3 sm:px-4 py-3 border-b border-transparent bg-white dark:bg-[#1e1c24] dark:border-white/10">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full px-4 py-2 bg-gray-50 dark:bg-white/10 dark:text-white dark:placeholder-white/50 border border-transparent rounded-lg focus:outline-none"
            autoFocus
          />
        </div>
      )}

      {/* MESSAGES - scrollable only when content overflows (mobile: no scroll when typing + empty) */}
      <div
        className={`flex-1 min-h-0 px-4 py-4 space-y-3 bg-white dark:bg-[#1e1c24] chat-messages-scroll ${
          filteredMessages.length === 0 ? "overflow-y-hidden" : "overflow-y-auto"
        }`}
      >
        {isGroupMessagesLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-violet-500 dark:border-[#b29bff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {filteredMessages.map((msg) => (
              <MessageBubble
                key={msg._id}
                msg={msg}
                isMine={toStr(msg.senderId) === toStr(authUser?._id)}
                authUser={authUser}
                selectedUser={null}
                showSenderName={toStr(msg.senderId) !== toStr(authUser?._id)}
              />
            ))}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* INPUT - fixed height bottom bar */}
      <div className="flex-shrink-0 min-h-[70px] w-full">
        <GroupMessageInput />
      </div>

      {showMembers && (
        <GroupMembersPanel
          group={selectedGroup}
          onClose={() => setShowMembers(false)}
        />
      )}
    </div>
  );
}
