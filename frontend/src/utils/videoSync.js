// src/utils/videoSync.js

/**
 * Check if two timestamps are out of sync
 * @param {number} currentTime - Current playback time
 * @param {number} targetTime - Target playback time
 * @param {number} threshold - Threshold in seconds (default: 1)
 * @returns {boolean} - Whether times are out of sync
 */
export const isOutOfSync = (currentTime, targetTime, threshold = 1) => {
  return Math.abs(currentTime - targetTime) > threshold;
};

/**
 * Extract YouTube video ID from various URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if invalid
 */
export const getYouTubeVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Validate video URL
 * @param {string} url - Video URL
 * @param {string} type - Video type ('youtube' or 'local')
 * @returns {boolean} - Whether URL is valid
 */
export const isValidVideoUrl = (url, type) => {
  if (!url) return false;

  if (type === 'youtube') {
    return getYouTubeVideoId(url) !== null;
  }

  if (type === 'local') {
    return url.startsWith('blob:') || url.startsWith('http');
  }

  return false;
};

/**
 * Format time in MM:SS or HH:MM:SS
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Debounce function to limit rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit rate of function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Calculate sync delay based on network conditions
 * @param {number} latency - Network latency in ms
 * @returns {number} - Recommended sync threshold in seconds
 */
export const calculateSyncThreshold = (latency) => {
  if (latency < 50) return 0.5;
  if (latency < 100) return 1;
  if (latency < 200) return 1.5;
  return 2;
};