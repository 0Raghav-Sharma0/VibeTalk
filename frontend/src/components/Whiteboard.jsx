// src/components/Whiteboard.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";

export default function Whiteboard({ roomId }) {
  const socket = useAuthStore((state) => state.socket);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const drawingHistory = useRef([]);
  const historyIndex = useRef(-1);

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(true);
  const [isFilled, setIsFilled] = useState(false);

  const colorPalette = [
    "#000000", "#ffffff", "#ff3b30", "#ff9500", "#ffcc00",
    "#4cd964", "#5ac8fa", "#007aff", "#5856d6", "#ff2d55"
  ];

  /* ==========================================
      JOIN ROOM
  ========================================== */
  useEffect(() => {
    if (roomId && socket) socket.emit("join-room", roomId);
  }, [roomId, socket]);

  /* ==========================================
      INITIALIZE CANVAS
  ========================================== */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const temp = document.createElement("canvas");
      const tempCtx = temp.getContext("2d");

      if (ctxRef.current) {
        temp.width = canvas.width;
        temp.height = canvas.height;
        tempCtx.drawImage(canvas, 0, 0);
      }

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = size;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      if (temp.width > 0) ctx.drawImage(temp, 0, 0);
      ctxRef.current = ctx;
    };

    setTimeout(resize, 100);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  /* ==========================================
      UPDATE CONTEXT
  ========================================== */
  useEffect(() => {
    if (ctxRef.current) {
      if (tool === "eraser") {
        ctxRef.current.globalCompositeOperation = "destination-out";
        ctxRef.current.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctxRef.current.globalCompositeOperation = "source-over";
        ctxRef.current.strokeStyle = color;
        ctxRef.current.fillStyle = color;
      }
      ctxRef.current.lineWidth = size;
    }
  }, [tool, color, size]);

  /* ==========================================
      RECEIVE EVENTS
  ========================================== */
  useEffect(() => {
    if (!socket) return;

    const handleDraw = (payload) => {
      drawOnCanvas({ ...payload, remote: true });
    };

    const handleClear = () => {
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveToHistory();
    };

    socket.on("whiteboard-draw", handleDraw);
    socket.on("whiteboard-clear", handleClear);

    return () => {
      socket.off("whiteboard-draw", handleDraw);
      socket.off("whiteboard-clear", handleClear);
    };
  }, [socket]);

  /* ==========================================
      DRAW ON CANVAS (Remote + Local)
  ========================================== */
  const drawOnCanvas = useCallback((data) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const prevComp = ctx.globalCompositeOperation;
    const prevStroke = ctx.strokeStyle;
    const prevFill = ctx.fillStyle;
    const prevWidth = ctx.lineWidth;

    if (data.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = data.color;
      ctx.fillStyle = data.color;
    }
    ctx.lineWidth = data.size;

    if (data.tool === "pen" || data.tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(data.lastX, data.lastY);
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    } else {
      // 🟢 NO HISTORY RESTORE FOR REMOTE SHAPES
      drawShape(ctx, data);
    }

    ctx.globalCompositeOperation = prevComp;
    ctx.strokeStyle = prevStroke;
    ctx.fillStyle = prevFill;
    ctx.lineWidth = prevWidth;
  }, []);

  /* ==========================================
      DRAW SHAPES
  ========================================== */
  const drawShape = useCallback((ctx, data) => {
    const { startX, startY, endX, endY, tool, isFilled } = data;
    const width = endX - startX;
    const height = endY - startY;

    ctx.beginPath();

    switch (tool) {
      case "line":
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        break;

      case "rectangle":
        if (isFilled) ctx.fillRect(startX, startY, width, height);
        else ctx.strokeRect(startX, startY, width, height);
        break;

      case "circle":
        const cx = (startX + endX) / 2;
        const cy = (startY + endY) / 2;
        const r = Math.max(Math.abs(width), Math.abs(height)) / 2;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        isFilled ? ctx.fill() : ctx.stroke();
        break;

      default:
        break;
    }
  }, []);

  /* ==========================================
      HISTORY
  ========================================== */
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (historyIndex.current < drawingHistory.current.length - 1) {
      drawingHistory.current = drawingHistory.current.slice(
        0,
        historyIndex.current + 1
      );
    }

    drawingHistory.current.push(img);
    historyIndex.current++;

    if (drawingHistory.current.length > 50) {
      drawingHistory.current.shift();
      historyIndex.current--;
    }
  }, []);

  /* ==========================================
      SHAPE PREVIEW (LOCAL ONLY)
  ========================================== */
  const drawCurrentShape = useCallback((x, y) => {
    const ctx = ctxRef.current;

    // 🟢 IMPORTANT: ONLY RESTORE FOR LOCAL PREVIEW
    if (historyIndex.current >= 0) {
      ctx.putImageData(drawingHistory.current[historyIndex.current], 0, 0);
    }

    drawShape(ctx, {
      startX: startPos.current.x,
      startY: startPos.current.y,
      endX: x,
      endY: y,
      tool,
      isFilled,
      color,
      size
    });
  }, [tool, isFilled, color, size, drawShape]);

  /* ==========================================
      FINISH SHAPE
  ========================================== */
  const finishShape = useCallback((x, y) => {
    drawShape(ctxRef.current, {
      startX: startPos.current.x,
      startY: startPos.current.y,
      endX: x,
      endY: y,
      tool,
      isFilled,
      color,
      size
    });

    socket.emit("whiteboard-draw", {
      roomId,
      startX: startPos.current.x,
      startY: startPos.current.y,
      endX: x,
      endY: y,
      tool,
      isFilled,
      color,
      size,
      remote: true    // 🟢 KEY FIX
    });

    saveToHistory();
    isDrawing.current = false;
  }, [roomId, tool, isFilled, color, size, socket, saveToHistory, drawShape]);

  /* ==========================================
      FREEHAND
  ========================================== */
  const startFreehand = useCallback((x, y) => {
    isDrawing.current = true;
    startPos.current = { x, y };

    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const drawFreehand = useCallback((x, y) => {
    if (!isDrawing.current) return;

    const ctx = ctxRef.current;
    ctx.lineTo(x, y);
    ctx.stroke();

    socket.emit("whiteboard-draw", {
      roomId,
      lastX: startPos.current.x,
      lastY: startPos.current.y,
      x,
      y,
      tool,
      color,
      size,
      remote: true
    });

    startPos.current = { x, y };
  }, [roomId, color, size, tool, socket]);

  const stopDrawing = useCallback(() => {
    if (isDrawing.current) {
      isDrawing.current = false;
      saveToHistory();
    }
  }, [saveToHistory]);

  /* ==========================================
      MOUSE / TOUCH EVENTS
  ========================================== */
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

    return { x: x * scaleX, y: y * scaleY };
  };

  const handleDown = (e) => {
    const { x, y } = getCoords(e);

    if (tool === "pen" || tool === "eraser") startFreehand(x, y);
    else {
      saveToHistory();
      isDrawing.current = true;
      startPos.current = { x, y };
    }
  };

  const handleMove = (e) => {
    if (!isDrawingEnabled) return;

    const { x, y } = getCoords(e);

    if (tool === "pen" || tool === "eraser") drawFreehand(x, y);
    else if (isDrawing.current) drawCurrentShape(x, y);
  };

  const handleUp = (e) => {
    if (!isDrawing.current) return;

    const { x, y } = getCoords(e);

    if (tool === "pen" || tool === "eraser") stopDrawing();
    else finishShape(x, y);
  };

  /* ==========================================
      CLEAR
  ========================================== */
  const clearBoard = () => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveToHistory();
    socket.emit("whiteboard-clear", { roomId });
  };

  /* ==========================================
      DOWNLOAD
  ========================================== */
  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const isFreehandTool = tool === "pen" || tool === "eraser";

  /* ==========================================
      UI
  ========================================== */
  return (
    <div className="flex flex-col h-full bg-base-100 border-l border-base-300">
      {/* Toolbar */}
      <div className="p-3 flex flex-wrap gap-3 items-center border-b bg-base-200">

        {/* Tools */}
        <div className="flex gap-1 bg-base-300 rounded-lg p-1">
          <button onClick={() => setTool("pen")} className={`p-2 rounded ${tool === "pen" ? "bg-primary" : "hover:bg-base-100"}`}>✏️</button>
          <button onClick={() => setTool("eraser")} className={`p-2 rounded ${tool === "eraser" ? "bg-primary" : "hover:bg-base-100"}`}>🧽</button>
          <button onClick={() => setTool("line")} className={`p-2 rounded ${tool === "line" ? "bg-primary" : "hover:bg-base-100"}`}>📏</button>
          <button onClick={() => setTool("rectangle")} className={`p-2 rounded ${tool === "rectangle" ? "bg-primary" : "hover:bg-base-100"}`}>⬜</button>
          <button onClick={() => setTool("circle")} className={`p-2 rounded ${tool === "circle" ? "bg-primary" : "hover:bg-base-100"}`}>⭕</button>
        </div>

        {/* Colors */}
        <div className="flex gap-1 items-center">
          {colorPalette.map((col) => (
            <button key={col} onClick={() => setColor(col)} className={`w-6 h-6 rounded border-2 ${color === col ? "border-primary" : "border-base-300"}`} style={{ backgroundColor: col }} />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded border border-base-300" />
        </div>

        {/* Brush Size */}
        <div className="flex gap-2 items-center">
          <span>{tool === "eraser" ? "Eraser" : "Brush"} Size:</span>
          <input type="range" min="2" max="25" value={size} onChange={(e) => setSize(Number(e.target.value))} />
          <span>{size}px</span>
        </div>

        {/* Filled */}
        {!isFreehandTool && (
          <button onClick={() => setIsFilled(!isFilled)} className={`px-3 py-1 rounded ${isFilled ? "bg-primary" : "bg-base-300"}`}>
            {isFilled ? "🟦 Filled" : "⬜ Outline"}
          </button>
        )}

        {/* Actions */}
        <div className="ml-auto flex gap-2">
          <button onClick={clearBoard} className="px-3 py-1 bg-error text-error-content rounded">🗑️ Clear</button>
          <button onClick={downloadCanvas} className="px-3 py-1 bg-info text-info-content rounded">💾 Save</button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-gray-100">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-white touch-none"
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
          onTouchStart={(e) => (e.preventDefault(), handleDown(e))}
          onTouchMove={(e) => (e.preventDefault(), handleMove(e))}
          onTouchEnd={(e) => (e.preventDefault(), handleUp(e))}
        />
      </div>
    </div>
  );
}
