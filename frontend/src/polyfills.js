// src/polyfills.js
// Simple polyfills for browser environment
if (typeof global === 'undefined') {
  window.global = window;
}

if (typeof process === 'undefined') {
  window.process = {
    env: {},
    version: '',
    nextTick: (callback) => Promise.resolve().then(callback)
  };
}