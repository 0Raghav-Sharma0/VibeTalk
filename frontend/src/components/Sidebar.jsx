import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useMusicStore } from '../store/musicStore';
import { Users } from 'lucide-react';
import SidebarSkeleton from './skeletons/SidebarSkeleton';
import { useAuthStore } from '../store/useAuthStore';

const Sidebar = () => {
    const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
    const { onlineUsers } = useAuthStore();
    const { isMusicPlayerOpen, toggleMusicPlayer } = useMusicStore();
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);

    useEffect(() => {
        getUsers();
    }, [getUsers]);

    useEffect(() => {
        const unsubscribe = useChatStore.getState().subscribeToMessages();
        return () => {
            useChatStore.getState().unsubscribeFromMessages();
        };
    }, []);

    const handleUserSelect = (user) => {
        setSelectedUser(user);

        useChatStore.setState((state) => ({
            users: state.users.map((u) =>
                u._id === user._id ? { ...u, hasNewMessage: false } : u
            ),
        }));

        if (isMusicPlayerOpen) {
            toggleMusicPlayer();
        }
    };

    const filteredUsers = showOnlineOnly
        ? users.filter((user) => onlineUsers.includes(user._id) || user.hasNewMessage)
        : [...users].sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    if (isUsersLoading) {
        return <SidebarSkeleton />;
    }

    return (
        <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col">
            <div className="border-b border-base-300 w-full p-5">
                <div className="flex items-center gap-2">
                    <Users className="size-6" />
                    <span className="font-medium hidden lg:block">Contacts</span>
                </div>
                <div className="mt-3 hidden lg:flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={showOnlineOnly}
                            onChange={(e) => setShowOnlineOnly(e.target.checked)}
                            className="checkbox checkbox-sm"
                        />
                        <span className="text-sm">Show online only</span>
                    </label>
                    <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 scrollbar-fade">
                {filteredUsers.map((user) => (
                    <button
                        key={user._id}
                        onClick={() => handleUserSelect(user)}
                        className={`w-full p-3 flex items-center gap-3 group transition-colors 
                            ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : "bg-transparent"} 
                            ${user.hasNewMessage ? "bg-yellow-100 font-bold" : ""} 
                            hover:bg-base-300`}
                    >
                        <div className="relative mx-auto lg:mx-0">
                            <img
                                src={user.profilePic || "/boy.png"}
                                alt={user.name}
                                className="size-12 object-cover rounded-full"
                            />
                            {onlineUsers.includes(user._id) && (
                                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                            )}
                        </div>
                        <div className="hidden lg:block text-left min-w-0 flex-1">
                            <div className="font-medium truncate group-hover:text-green-700">
                                {user.fullName}
                            </div>
                            <div className={`text-sm ${onlineUsers.includes(user._id) ? "text-green-500" : "text-gray-500"}`}>
                                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                            </div>
                        </div>
                        {user.hasNewMessage && selectedUser?._id !== user._id && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                New Message
                            </span>
                        )}  
                    </button>
                ))}
                {filteredUsers.length === 0 && (
                    <div className="text-center text-zinc-500 py-4">No online users</div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
