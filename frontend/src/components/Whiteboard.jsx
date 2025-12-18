// src/components/Whiteboard.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";

export default function Whiteboard({ roomId, onClose }) {
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
  const [showMobileClose, setShowMobileClose] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const colorPalette = [
    "#000000", "#ffffff", "#ff3b30", "#ff9500", "#ffcc00",
    "#4cd964", "#5ac8fa", "#007aff", "#5856d6", "#ff2d55"
  ];

  const tools = [
    { id: "pen", icon: "✏️", label: "Pen" },
    { id: "eraser", icon: "🧽", label: "Eraser" },
    { id: "line", icon: "📏", label: "Line" },
    { id: "rectangle", icon: "⬜", label: "Rectangle" },
    { id: "ellipse", icon: "⭕", label: "Ellipse" },
    { id: "circle", icon: "⚪", label: "Circle" }
  ];

  /* ========== Core drawing functions ========== */

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
      console.log(123, err);
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

      const maxValue = Math.max(
        Math.abs(startX),
        Math.abs(startY),
        Math.abs(endX),
        Math.abs(endY)
      );

      const isNormalized = maxValue <= 1.5 && canvas.width > 50 && canvas.height > 50;

      if (isNormalized) {
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

  /* ========== Event handlers ========== */

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

  const handleDown = (e) => {
    if (!isDrawingEnabled) return;
    if (e.type === 'mousedown' && e.preventDefault) e.preventDefault();

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
    if (e.type === 'mousemove' && e.preventDefault) e.preventDefault();

    const { x, y } = getCoords(e);

    if (tool === "pen" || tool === "eraser") drawFreehand(x, y);
    else if (isDrawing.current) drawCurrentShape(x, y);
  };

  const handleUp = (e) => {
    if (!isDrawingEnabled) return;
    if (!isDrawing.current) return;
    if (e.type === 'mouseup' && e.preventDefault) e.preventDefault();

    const { x, y } = getCoords(e);

    if (tool === "pen" || tool === "eraser") stopDrawing();
    else finishShape(x, y);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  /* ========== Effects ========== */

  useEffect(() => {
    if (roomId && socket) socket.emit("join-room", roomId);
  }, [roomId, socket]);

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
      
      canvas.willReadFrequently = true;

      if (temp.width > 0) ctx.drawImage(temp, 0, 0);
      ctxRef.current = ctx;
    };

    setTimeout(resize, 100);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowMobileClose(mobile);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    if (ctxRef.current) {
      if (tool === "eraser") {
        ctxRef.current.globalCompositeOperation = "destination-out";
        ctxRef.current.strokeStyle = "rgba(0,0,0,1)";
        ctxRef.current.fillStyle = "rgba(0,0,0,1)";
      } else {
        ctxRef.current.globalCompositeOperation = "source-over";
        ctxRef.current.strokeStyle = color;
        ctxRef.current.fillStyle = color;
      }
      ctxRef.current.lineWidth = size;
    }
  }, [tool, color, size]);

  useEffect(() => {
    if (!socket) return;

    const handleDraw = (payload) => {
      drawOnCanvas({ ...payload, remote: true });
    };

    const handleClear = () => {
      const ctx = ctxRef.current;
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        saveToHistory();
      }
    };

    socket.on("whiteboard-draw", handleDraw);
    socket.on("whiteboard-clear", handleClear);

    return () => {
      socket.off("whiteboard-draw", handleDraw);
      socket.off("whiteboard-clear", handleClear);
    };
  }, [socket, drawOnCanvas, saveToHistory]);

  /* ========== Actions ========== */

  const clearBoard = () => {
    const ctx = ctxRef.current;
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveToHistory();
      if (socket && roomId) socket.emit("whiteboard-clear", { roomId });
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId || "drawing"}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const isFreehandTool = tool === "pen" || tool === "eraser";

  /* ========== Render ========== */
  return (
    <div className="flex flex-col h-full bg-base-100 border-l border-base-300 relative">
      {/* Mobile Close Button - Only visible on mobile */}
      {showMobileClose && (
        <button
          onClick={handleClose}
          className="md:hidden absolute top-3 right-3 z-50 w-10 h-10 bg-error text-error-content rounded-full flex items-center justify-center shadow-lg hover:bg-error/90 transition-all duration-200 active:scale-95"
          style={{ zIndex: 1000 }}
          title="Close Whiteboard"
        >
          <span className="text-xl">✕</span>
        </button>
      )}

      {/* Top Toolbar - Enhanced with better spacing and visual hierarchy */}
      <div className={`p-3 ${isMobile ? 'px-2' : 'px-4'} flex flex-wrap gap-2 items-center border-b bg-base-200/80 backdrop-blur-sm`}>
        {/* Tools Section */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Tools</label>
          <div className="flex gap-1 bg-base-300 rounded-xl p-1 shadow-sm">
            {tools.map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setTool(id)}
                className={`
                  ${isMobile ? 'p-1.5 text-sm min-w-[36px]' : 'p-2.5 min-w-[44px]'} 
                  rounded-lg transition-all duration-200 group relative
                  ${tool === id 
                    ? "bg-primary shadow-md scale-105 text-primary-content" 
                    : "hover:bg-base-100 hover:scale-102 text-base-content"
                  }
                `}
                title={label}
              >
                <span className={isMobile ? 'text-base' : 'text-lg'}>{icon}</span>
                {!isMobile && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-base-300 text-xs text-base-content px-2 py-1 rounded-md whitespace-nowrap">
                      {label}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Colors Section */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Colors</label>
          <div className="flex gap-2 items-center bg-base-300 rounded-xl p-1.5 shadow-sm">
            <div className="flex gap-1">
              {colorPalette.map((col) => (
                <button
                  key={col}
                  onClick={() => setColor(col)}
                  className={`
                    ${isMobile ? 'w-5 h-5' : 'w-7 h-7'} 
                    rounded-full border-2 transition-transform duration-200 hover:scale-110 shadow-sm
                    ${color === col ? "border-primary scale-110 ring-2 ring-primary/30" : "border-base-300"}
                  `}
                  style={{ backgroundColor: col }}
                  title={col}
                />
              ))}
            </div>
            <div className="w-px h-4 bg-base-400 mx-0.5"></div>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)} 
              className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg border border-base-300 cursor-pointer shadow-sm`} 
              title="Custom Color" 
            />
          </div>
        </div>

        {/* Brush Size Section */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
            {tool === "eraser" ? "Eraser Size" : "Brush Size"}
          </label>
          <div className="flex gap-2 items-center bg-base-300 rounded-xl px-3 py-1.5 shadow-sm">
            <input 
              type="range" 
              min="2" 
              max="25" 
              value={size} 
              onChange={(e) => setSize(Number(e.target.value))} 
              className={`${isMobile ? 'w-16' : 'w-24'} accent-primary`} 
            />
            <div className="flex items-center gap-1 min-w-[50px]">
              <div 
                className="rounded-full bg-base-content"
                style={{
                  width: `${Math.max(8, size)}px`,
                  height: `${Math.max(8, size)}px`,
                  backgroundColor: tool === "eraser" ? '#9ca3af' : color
                }}
              ></div>
              <span className="text-sm font-medium w-5">{size}</span>
            </div>
          </div>
        </div>

        {/* Fill Toggle */}
        {!isFreehandTool && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Fill</label>
            <button 
              onClick={() => setIsFilled(!isFilled)} 
              className={`
                ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5'} 
                rounded-xl transition-all duration-200 font-medium
                ${isFilled 
                  ? "bg-primary text-primary-content shadow-md" 
                  : "bg-base-300 hover:bg-base-100 shadow-sm"
                }
              `}
            >
              {isMobile ? (isFilled ? "🟦" : "⬜") : (isFilled ? "🟦 Filled" : "⬜ Outline")}
            </button>
          </div>
        )}

        {/* Actions Section */}
        <div className={`flex flex-col gap-1 ${isMobile ? 'ml-1' : 'ml-auto'}`}>
          <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Actions</label>
          <div className="flex gap-1">
            <div className="flex gap-0.5 bg-base-300 rounded-xl p-0.5 shadow-sm">
              <button 
                onClick={() => {
                  if (historyIndex.current > 0) {
                    historyIndex.current--;
                    const img = drawingHistory.current[historyIndex.current];
                    ctxRef.current.putImageData(img, 0, 0);
                  } else if (historyIndex.current === 0) {
                    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    historyIndex.current = -1;
                    drawingHistory.current = [];
                  }
                }} 
                className={`${isMobile ? 'p-1.5 text-sm' : 'p-2.5'} rounded-lg hover:bg-base-100 transition-all duration-200 hover:scale-105`}
                title="Undo"
              >
                ↩️
              </button>
              <button 
                onClick={() => {
                  if (historyIndex.current < drawingHistory.current.length - 1) {
                    historyIndex.current++;
                    const img = drawingHistory.current[historyIndex.current];
                    ctxRef.current.putImageData(img, 0, 0);
                  }
                }} 
                className={`${isMobile ? 'p-1.5 text-sm' : 'p-2.5'} rounded-lg hover:bg-base-100 transition-all duration-200 hover:scale-105`}
                title="Redo"
              >
                ↪️
              </button>
            </div>

            <button 
              onClick={() => setIsDrawingEnabled(!isDrawingEnabled)} 
              className={`
                ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-4 py-2.5'} 
                rounded-xl transition-all duration-200 font-medium
                ${isDrawingEnabled 
                  ? "bg-success text-success-content shadow-md" 
                  : "bg-error text-error-content shadow-md"
                }
              `}
            >
              {isMobile ? (isDrawingEnabled ? "🎯" : "🚫") : (isDrawingEnabled ? "🎯 Drawing" : "🚫 Locked")}
            </button>

            <button 
              onClick={downloadCanvas} 
              className={`${isMobile ? 'px-2 py-1.5 text-xs' : 'px-4 py-2.5'} rounded-xl bg-info text-info-content hover:bg-info/90 transition-all duration-200 shadow-md font-medium`}
            >
              {isMobile ? "💾" : "💾 Save"}
            </button>
            <button 
              onClick={clearBoard} 
              className={`${isMobile ? 'px-2 py-1.5 text-xs' : 'px-4 py-2.5'} rounded-xl bg-error text-error-content hover:bg-error/90 transition-all duration-200 shadow-md font-medium`}
            >
              {isMobile ? "🗑️" : "🗑️ Clear"}
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-white touch-none cursor-crosshair shadow-inner"
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
        />
        
        {/* Drawing Status Overlay */}
        {!isDrawingEnabled && (
          <div className="absolute inset-0 bg-base-100/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-error text-error-content px-4 py-3 rounded-xl shadow-lg text-base font-semibold">
              🚫 Drawing Disabled
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Bottom Status Bar */}
      <div className="bg-base-200/90 backdrop-blur-sm border-t border-base-300">
        <div className={`${isMobile ? 'px-2 py-2' : 'px-4 py-3'}`}>
          <div className="flex items-center justify-between">
            {/* Left Side - Current Settings */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-base-content/60">Tool:</span>
                <span className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} bg-primary/10 text-primary rounded-lg font-semibold capitalize`}>
                  {tool}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-base-content/60">Color:</span>
                <div className="flex items-center gap-1 px-2 py-1 bg-base-300 rounded-lg">
                  <div 
                    className="w-3 h-3 rounded-full border border-base-400 shadow-sm"
                    style={{ backgroundColor: color }}
                  ></div>
                  {!isMobile && (
                    <span className="text-xs font-mono font-semibold">{color}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-base-content/60">Size:</span>
                <span className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} bg-base-300 rounded-lg font-semibold`}>
                  {size}px
                </span>
              </div>
            </div>

            {/* Right Side - Room Info & Status */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${socket ? 'bg-success animate-pulse' : 'bg-error'}`}></div>
                {!isMobile && (
                  <>
                    <span className="text-xs font-medium text-base-content/60">Status:</span>
                    <span className="text-xs font-semibold">{socket ? 'Connected' : 'Disconnected'}</span>
                  </>
                )}
              </div>

              {!isMobile && <div className="w-px h-4 bg-base-400"></div>}

              <div className="flex items-center gap-1">
                {!isMobile && <span className="text-xs font-medium text-base-content/60">Room:</span>}
                <span className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} bg-primary/10 text-primary rounded-lg font-semibold`}>
                  {isMobile ? (roomId ? '✓' : '✗') : (roomId || 'No Room')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}