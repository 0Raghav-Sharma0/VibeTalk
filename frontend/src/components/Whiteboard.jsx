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

  /* ========== Drawing helpers (MUST be defined before any useEffect that references them) ========== */

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

      case "circle": {
        const cx = (startX + endX) / 2;
        const cy = (startY + endY) / 2;
        const r = Math.max(Math.abs(width), Math.abs(height)) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r, 0, 0, Math.PI * 2);
        if (isFilled) ctx.fill();
        else ctx.stroke();
        break;
      }

      case "circle-ellipse":
      case "ellipse": {
        const cx = (startX + endX) / 2;
        const cy = (startY + endY) / 2;
        const rx = Math.abs(width) / 2;
        const ry = Math.abs(height) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (isFilled) ctx.fill();
        else ctx.stroke();
        break;
      }

      default:
        break;
    }
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    try {
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
    } catch (err) {
      // ignore tainted canvas or invalid sizes
    }
  }, []);

  const drawOnCanvas = useCallback((data) => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const prevComp = ctx.globalCompositeOperation;
    const prevStroke = ctx.strokeStyle;
    const prevFill = ctx.fillStyle;
    const prevWidth = ctx.lineWidth;

    if (data.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.fillStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = data.color || ctx.strokeStyle;
      ctx.fillStyle = data.color || ctx.fillStyle;
    }
    ctx.lineWidth = data.size || ctx.lineWidth;

    if (data.tool === "pen" || data.tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(data.lastX, data.lastY);
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    } else {
      let startX = data.startX;
      let startY = data.startY;
      let endX = data.endX;
      let endY = data.endY;

      const looksNormalized = (v) =>
        typeof v === "number" && v >= 0 && v <= 1;

      if (
        looksNormalized(startX) &&
        looksNormalized(startY) &&
        looksNormalized(endX) &&
        looksNormalized(endY)
      ) {
        startX = startX * canvas.width;
        startY = startY * canvas.height;
        endX = endX * canvas.width;
        endY = endY * canvas.height;
      }

      drawShape(ctx, {
        ...data,
        startX,
        startY,
        endX,
        endY
      });
    }

    ctx.globalCompositeOperation = prevComp;
    ctx.strokeStyle = prevStroke;
    ctx.fillStyle = prevFill;
    ctx.lineWidth = prevWidth;
  }, [drawShape]);

  const drawCurrentShape = useCallback((x, y) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (historyIndex.current >= 0 && drawingHistory.current[historyIndex.current]) {
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

  const finishShape = useCallback((x, y) => {
    if (!ctxRef.current || !canvasRef.current) return;

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

    const canvas = canvasRef.current;
    const normalized = {
      startX: startPos.current.x / canvas.width,
      startY: startPos.current.y / canvas.height,
      endX: x / canvas.width,
      endY: y / canvas.height
    };

    socket?.emit("whiteboard-draw", {
      roomId,
      ...normalized,
      tool,
      isFilled,
      color,
      size,
      remote: true
    });

    saveToHistory();
    isDrawing.current = false;
  }, [roomId, tool, isFilled, color, size, socket, saveToHistory, drawShape]);

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

    socket?.emit("whiteboard-draw", {
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
     Utility: get coordinates scaled to canvas
  ========================================== */
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };
  /* ==========================================
     JOIN ROOM
  ========================================== */
  useEffect(() => {
    if (roomId && socket) socket.emit("join-room", roomId);
  }, [roomId, socket]);

  /* ==========================================
     INITIALIZE CANVAS (resize & context)
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
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ==========================================
     UPDATE CONTEXT (tool/color/size)
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
     SOCKET: receive draw / clear
     (Now safe because drawOnCanvas & saveToHistory are defined above)
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
  }, [socket, drawOnCanvas, saveToHistory]);

  /* ==========================================
     MOUSE / TOUCH EVENT HANDLERS
  ========================================== */
  const handleDown = (e) => {
    if (!isDrawingEnabled) return;
    if (e.preventDefault) e.preventDefault();

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
    if (e.preventDefault) e.preventDefault();

    const { x, y } = getCoords(e);

    if (tool === "pen" || tool === "eraser") drawFreehand(x, y);
    else if (isDrawing.current) drawCurrentShape(x, y);
  };

  const handleUp = (e) => {
    if (!isDrawingEnabled) return;
    if (!isDrawing.current) return;
    if (e.preventDefault) e.preventDefault();

    const { x, y } = getCoords(e);

    if (tool === "pen" || tool === "eraser") stopDrawing();
    else finishShape(x, y);
  };

  /* ==========================================
     CLEAR & DOWNLOAD
  ========================================== */
  const clearBoard = () => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveToHistory();
    if (socket && roomId) socket.emit("whiteboard-clear", { roomId });
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId || "drawing"}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const isFreehandTool = tool === "pen" || tool === "eraser";
  /* ==========================================
     UI
  ========================================== */
  return (
    <div className="flex flex-col h-full bg-base-100 border-l border-base-300">
      <div className="p-3 flex flex-wrap gap-3 items-center border-b bg-base-200">
        <div className="flex gap-1 bg-base-300 rounded-lg p-1">
          <button onClick={() => setTool("pen")} className={`p-2 rounded ${tool === "pen" ? "bg-primary text-primary-content" : "hover:bg-base-100"}`} title="Pen">✏️</button>
          <button onClick={() => setTool("eraser")} className={`p-2 rounded ${tool === "eraser" ? "bg-primary text-primary-content" : "hover:bg-base-100"}`} title="Eraser">🧽</button>
          <button onClick={() => setTool("line")} className={`p-2 rounded ${tool === "line" ? "bg-primary text-primary-content" : "hover:bg-base-100"}`} title="Line">📏</button>
          <button onClick={() => setTool("rectangle")} className={`p-2 rounded ${tool === "rectangle" ? "bg-primary text-primary-content" : "hover:bg-base-100"}`} title="Rectangle">⬜</button>
          <button onClick={() => setTool("ellipse")} className={`p-2 rounded ${tool === "ellipse" ? "bg-primary text-primary-content" : "hover:bg-base-100"}`} title="Ellipse">⭕</button>
          <button onClick={() => setTool("circle")} className={`p-2 rounded ${tool === "circle" ? "bg-primary text-primary-content" : "hover:bg-base-100"}`} title="Circle (max radius)">⚪</button>
        </div>

        <div className="flex gap-1 items-center">
          {colorPalette.map((col) => (
            <button
              key={col}
              onClick={() => setColor(col)}
              className={`w-6 h-6 rounded border-2 ${color === col ? "border-primary" : "border-base-300"}`}
              style={{ backgroundColor: col }}
              title={col}
            />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded border border-base-300" title="Custom Color" />
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">{tool === "eraser" ? "Eraser" : "Brush"} Size:</span>
          <input type="range" min="2" max="25" value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-24" />
          <span className="text-sm w-8">{size}px</span>
        </div>

        {!isFreehandTool && (
          <button onClick={() => setIsFilled(!isFilled)} className={`px-3 py-1 rounded ${isFilled ? "bg-primary text-primary-content" : "bg-base-300"}`} title={isFilled ? "Filled" : "Outline"}>
            {isFilled ? "🟦 Filled" : "⬜ Outline"}
          </button>
        )}

        <div className="ml-auto flex gap-2">
          <button onClick={() => {
            if (historyIndex.current > 0) {
              historyIndex.current--;
              const img = drawingHistory.current[historyIndex.current];
              ctxRef.current.putImageData(img, 0, 0);
            } else if (historyIndex.current === 0) {
              ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              historyIndex.current = -1;
              drawingHistory.current = [];
            }
          }} className="px-3 py-1 rounded bg-base-300 hover:bg-base-100">↩️ Undo</button>

          <button onClick={() => {
            if (historyIndex.current < drawingHistory.current.length - 1) {
              historyIndex.current++;
              const img = drawingHistory.current[historyIndex.current];
              ctxRef.current.putImageData(img, 0, 0);
            }
          }} className="px-3 py-1 rounded bg-base-300 hover:bg-base-100">↪️ Redo</button>

          <button onClick={() => setIsDrawingEnabled(!isDrawingEnabled)} className={`px-3 py-1 rounded ${isDrawingEnabled ? "bg-success text-success-content" : "bg-error text-error-content"}`}>
            {isDrawingEnabled ? "✅ Draw" : "🚫 Draw"}
          </button>

          <button onClick={downloadCanvas} className="px-3 py-1 rounded bg-info text-info-content hover:bg-info/80">💾 Save</button>
          <button onClick={clearBoard} className="px-3 py-1 rounded bg-error text-error-content hover:bg-error/80">🗑️ Clear</button>
        </div>
      </div>

      <div className="flex-1 bg-gray-100 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-white touch-none cursor-crosshair"
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
          onTouchStart={(e) => { e.preventDefault(); handleDown(e); }}
          onTouchMove={(e) => { e.preventDefault(); handleMove(e); }}
          onTouchEnd={(e) => { e.preventDefault(); handleUp(e); }}
        />
      </div>

      <div className="px-3 py-2 bg-base-200 border-t border-base-300 text-sm text-base-content/70">
        <div className="flex justify-between items-center">
          <span>
            Tool: <strong>{tool}</strong> |
            Color: <span style={{ color }}>●</span> |
            Size: <strong>{size}px</strong>
          </span>
          <span>
            Room: <strong>{roomId || 'No Room'}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
