// src/components/Whiteboard.jsx
import { useRef, useEffect, useState, useCallback } from "react";
import { Eraser, Square, Circle, Minus, CircleDot, Undo2, Redo2, Download, Trash2, Lock, PenLine } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import "./Whiteboard.css";

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
    { id: "pen", Icon: PenLine, label: "Pen" },
    { id: "eraser", Icon: Eraser, label: "Eraser" },
    { id: "line", Icon: Minus, label: "Line" },
    { id: "rectangle", Icon: Square, label: "Rectangle" },
    { id: "ellipse", Icon: Circle, label: "Ellipse" },
    { id: "circle", Icon: CircleDot, label: "Circle" }
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
    <div className="whiteboard-panel relative">
      {/* Mobile Close Button */}
      {showMobileClose && (
        <button
          onClick={handleClose}
          className="md:hidden absolute top-3 right-3 z-50 w-10 h-10 bg-error text-error-content rounded-full flex items-center justify-center shadow-lg hover:bg-error/90 transition-all duration-200 active:scale-95"
          style={{ zIndex: 1000 }}
          title="Close Whiteboard"
        >
          <span className="text-xl">×</span>
        </button>
      )}

      {/* Toolbar */}
      <div className="wb-toolbar">
        {/* Tools */}
        <div className="wb-section">
          <span className="wb-section-label">Tools</span>
          <div className="wb-tools">
            {tools.map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => setTool(id)}
                className={`wb-tool-btn ${tool === id ? "active" : ""}`}
                title={label}
                data-tool={id}
              >
                <Icon size={20} strokeWidth={2.5} />
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="wb-section">
          <span className="wb-section-label">Colors</span>
          <div className="wb-colors">
            {colorPalette.map((col) => (
              <button
                key={col}
                onClick={() => setColor(col)}
                className={`wb-color-swatch ${color === col ? "active" : ""}`}
                style={{ backgroundColor: col }}
                title={col}
              />
            ))}
            <div className="wb-color-divider" />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="wb-color-picker"
              title="Custom Color"
            />
          </div>
        </div>

        {/* Brush Size */}
        <div className="wb-section">
          <span className="wb-section-label">
            {tool === "eraser" ? "Eraser Size" : "Brush Size"}
          </span>
          <div className="wb-size-wrap">
            <input
              type="range"
              min="2"
              max="25"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="wb-size-slider"
            />
            <div
              className="wb-size-preview"
              style={{
                width: `${Math.max(8, size)}px`,
                height: `${Math.max(8, size)}px`,
                backgroundColor: tool === "eraser" ? "#9ca3af" : color
              }}
            />
            <span className="wb-size-value">{size}</span>
          </div>
        </div>

        {/* Fill Toggle */}
        {!isFreehandTool && (
          <div className="wb-section">
            <span className="wb-section-label">Fill</span>
            <button
              onClick={() => setIsFilled(!isFilled)}
              className={`wb-fill-btn ${isFilled ? "active" : ""}`}
            >
              {isFilled ? "Filled" : "Outline"}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="wb-actions">
          <div className="wb-action-group">
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
              className="wb-action-btn"
              title="Undo"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={() => {
                if (historyIndex.current < drawingHistory.current.length - 1) {
                  historyIndex.current++;
                  const img = drawingHistory.current[historyIndex.current];
                  ctxRef.current.putImageData(img, 0, 0);
                }
              }}
              className="wb-action-btn"
              title="Redo"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <button
            onClick={() => setIsDrawingEnabled(!isDrawingEnabled)}
            className={`wb-action-btn primary ${isDrawingEnabled ? "drawing-on" : "drawing-off"}`}
          >
            {isDrawingEnabled ? <PenLine size={14} /> : <Lock size={14} />}
            {!isMobile && (isDrawingEnabled ? " Drawing" : " Locked")}
          </button>

          <button onClick={downloadCanvas} className="wb-action-btn primary save">
            <Download size={14} />
            {!isMobile && " Save"}
          </button>

          <button onClick={clearBoard} className="wb-action-btn primary clear">
            <Trash2 size={14} />
            {!isMobile && " Clear"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="wb-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="wb-canvas"
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
        />
        {!isDrawingEnabled && (
          <div className="absolute inset-0 bg-base-100/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-error text-error-content px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2">
              <Lock size={18} />
              Drawing Disabled
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="wb-status">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="wb-status-item">
            <span className="wb-status-label">Tool</span>
            <span className="wb-status-value highlight">{tool}</span>
          </div>
          <div className="wb-status-item">
            <span className="wb-status-label">Color</span>
            <div className="wb-status-value flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border border-base-400" style={{ backgroundColor: color }} />
              {!isMobile && <span className="font-mono text-xs">{color}</span>}
            </div>
          </div>
          <div className="wb-status-item">
            <span className="wb-status-label">Size</span>
            <span className="wb-status-value">{size}px</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="wb-status-item">
            <div className={`wb-status-dot ${socket ? "connected" : "disconnected"}`} />
            {!isMobile && (
              <span className="wb-status-value">{socket ? "Connected" : "Disconnected"}</span>
            )}
          </div>
          {roomId && (
            <div className="wb-status-item">
              <span className="wb-status-value highlight room-id" title={roomId}>{roomId}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}