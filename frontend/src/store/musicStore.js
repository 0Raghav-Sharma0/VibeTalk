import {create} from "zustand";

export const useMusicStore = create((set) => ({
    songQueue: [],
    currentSong: null,
    songName: null,
    isPlaying: false,
    isMusicPlayerOpen: false,
    showGif: false,
    showDiscoLight: false,
    setCurrentSong: (songUrl, songName) =>
        set((state) => ({
          ...state,
          currentSong: songUrl,
          songName: songName || "Unknown Song",
          isPlaying: true,
          isMusicPlayerOpen: true,
          showGif: true,
          showDiscoLight: true,
        })),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setIsMusicPlayerOpen: (isOpen) => set({ isMusicPlayerOpen: isOpen }),
    toggleMusicPlayer: () => {
        set((state) => ({ isMusicPlayerOpen: !state.isMusicPlayerOpen}))
    },
    setCloseMusicPlayer: () => set({ isMusicPlayerOpen: false, isPlaying: false, currentSong: null }),
}));
