// Whiteboard.jsx
import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io(
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : import.meta.env.VITE_BACKEND_URL
);

export default function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);   // ✅ FIXED
  const isDrawing = useRef(false);

  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);

  // Join room
  useEffect(() => {
    if (!roomId) return;
    console.log("Joined whiteboard room:", roomId);
    socket.emit("join-room", roomId);
  }, [roomId]);

  // Setup canvas + context
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
  }, []);

  // Listen for incoming drawing events
  // Listen for incoming drawing events
// Listen for incoming drawing events
useEffect(() => {
  socket.on("whiteboard-draw", (data) => {
    // SAFETY GUARDS (fix crash)
    if (!data) return;
    if (!ctxRef.current) return;
    if (!("color" in data)) return;

    const ctx = ctxRef.current;

    ctx.strokeStyle = data.color || "#000";
    ctx.lineWidth = data.size || 4;

    ctx.beginPath();
    ctx.moveTo(data.lastX, data.lastY);
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
  });

  socket.on("whiteboard-clear", () => {
    if (!ctxRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  return () => {
    socket.off("whiteboard-draw");
    socket.off("whiteboard-clear");
  };
}, []);


  let lastX = 0,
    lastY = 0;

  const startDrawing = (e) => {
    isDrawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  };

  const draw = (e) => {
    if (!isDrawing.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = ctxRef.current;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    socket.emit("whiteboard-draw", {
      roomId,
      lastX,
      lastY,
      x,
      y,
      color,
      size,
    });

    lastX = x;
    lastY = y;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    socket.emit("whiteboard-clear", { roomId });
  };

  return (
    <div className="flex flex-col h-full bg-base-100 border-l border-base-300">
      <div className="p-3 flex gap-4 items-center border-b bg-base-200">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-10 p-0 rounded"
        />

        <input
          type="range"
          min="2"
          max="25"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-32"
        />

        <button
          onClick={clearBoard}
          className="px-3 py-1 rounded bg-error text-error-content"
        >
          Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="flex-1 bg-white cursor-crosshair"
      />
    </div>
  );
}
