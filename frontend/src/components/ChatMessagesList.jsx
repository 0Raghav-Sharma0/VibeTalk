import React, { useRef, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import MessageBubble from "./MessageBubble";

const ESTIMATED_ROW_HEIGHT = 80;
const LOAD_MORE_THRESHOLD = 150;

export default function ChatMessagesList({
  messages,
  authUser,
  selectedUser,
  onLoadOlder,
  isLoadingOlder,
  hasMore,
  searchQuery,
}) {
  const parentRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const lastMessageIdRef = useRef(null);

  const filteredMessages = React.useMemo(() => {
    if (!searchQuery) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.text?.toLowerCase().includes(q) ||
        m.file?.name?.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  const virtualizer = useVirtualizer({
    count: filteredMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 5,
    measureElement: (el) => el?.getBoundingClientRect().height ?? ESTIMATED_ROW_HEIGHT,
  });

  const virtualItems = virtualizer.getVirtualItems();

  /* Load older when scrolling near top - capture scroll state before load */
  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el || !onLoadOlder || !hasMore || isLoadingOlder) return;
    const { scrollTop, scrollHeight } = el;
    if (scrollTop < LOAD_MORE_THRESHOLD) {
      prevScrollHeightRef.current = scrollHeight;
      prevScrollTopRef.current = scrollTop;
      onLoadOlder();
    }
  }, [onLoadOlder, hasMore, isLoadingOlder]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  /* Scroll to bottom when new message arrives or on initial load */
  useEffect(() => {
    const el = parentRef.current;
    if (!el || filteredMessages.length === 0) return;
    const lastMsg = filteredMessages[filteredMessages.length - 1];
    const lastId = lastMsg?._id;
    const prevLastId = lastMessageIdRef.current;
    if (lastId && lastId !== prevLastId) {
      lastMessageIdRef.current = lastId;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - el.clientHeight;
      });
    }
  }, [filteredMessages, filteredMessages.length]);

  /* Preserve scroll position when older messages load */
  const prevCountRef = useRef(filteredMessages.length);
  useEffect(() => {
    const el = parentRef.current;
    const count = filteredMessages.length;
    if (!el || isLoadingOlder) return;
    if (count > prevCountRef.current) {
      const prevHeight = prevScrollHeightRef.current;
      const prevTop = prevScrollTopRef.current;
      const lastMsg = filteredMessages[filteredMessages.length - 1];
      const firstMsg = filteredMessages[0];
      const prevLastId = lastMessageIdRef.current;
      const lastId = lastMsg?._id;
      if (lastId === prevLastId && prevHeight > 0 && prevTop >= 0) {
        requestAnimationFrame(() => {
          const newHeight = el.scrollHeight;
          el.scrollTop = prevTop + (newHeight - prevHeight);
        });
      }
    }
    prevCountRef.current = count;
    prevScrollHeightRef.current = el.scrollHeight;
    prevScrollTopRef.current = el.scrollTop;
  }, [filteredMessages, filteredMessages.length, isLoadingOlder]);

  if (filteredMessages.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center px-4">
        <p className="text-sm text-gray-500 dark:text-white/50">
          {searchQuery ? "No matching messages" : "No messages yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col relative">
      {/* Loading older indicator */}
      {isLoadingOlder && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 dark:bg-white/10 backdrop-blur-sm">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-xs text-white/90">Loading older...</span>
          </div>
        </div>
      )}

      <div
        ref={parentRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden chat-messages-scroll px-4 sm:px-5 py-4 sm:py-5 hardware-accelerate"
        style={{ contain: "paint" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const msg = filteredMessages[virtualRow.index];
            if (!msg) return null;
            return (
              <div
                key={msg._id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <MessageBubble
                  msg={msg}
                  isMine={msg.senderId === authUser?._id}
                  authUser={authUser}
                  selectedUser={selectedUser}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
