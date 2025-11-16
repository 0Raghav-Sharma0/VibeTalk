// src/components/Whiteboard.jsx
import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io(
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : import.meta.env.VITE_BACKEND_URL
);

export default function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);

  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);

  let lastX = 0;
  let lastY = 0;

  // JOIN ROOM
  useEffect(() => {
    if (!roomId) return;
    socket.emit("join-room", roomId);
  }, [roomId]);

  // INITIALIZE CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;

    const resize = () => {
      const temp = document.createElement("canvas");
      temp.width = canvas.width;
      temp.height = canvas.height;
      temp.getContext("2d").drawImage(canvas, 0, 0);

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.drawImage(temp, 0, 0);

      ctxRef.current = ctx;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // RECEIVE DRAW FROM OTHERS
  useEffect(() => {
    socket.on("whiteboard-draw", (data) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.size;
      ctx.beginPath();
      ctx.moveTo(data.lastX, data.lastY);
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    });

    socket.on("whiteboard-clear", () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("whiteboard-draw");
      socket.off("whiteboard-clear");
    };
  }, []);

  /** ------------------------
   * 🖱 LAPTOP MOUSE EVENTS
   -------------------------**/
  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    drawStroke(e.clientX, e.clientY);
  };

  const handleMouseUp = () => (isDrawing.current = false);

  /** ------------------------
   * 📱 MOBILE TOUCH EVENTS
   -------------------------**/
  const handleTouchStart = (e) => {
    isDrawing.current = true;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    lastX = touch.clientX - rect.left;
    lastY = touch.clientY - rect.top;
  };

  const handleTouchMove = (e) => {
    if (!isDrawing.current) return;
    const touch = e.touches[0];
    drawStroke(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => (isDrawing.current = false);

  /** ------------------------
   * ✏️ DRAW FUNCTION
   -------------------------**/
  const drawStroke = (xPos, yPos) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = xPos - rect.left;
    const y = yPos - rect.top;

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

  /** CLEAR BOARD */
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
        className="flex-1 bg-white touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}
