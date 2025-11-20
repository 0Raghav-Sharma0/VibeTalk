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

  const [tool, setTool] = useState("pen"); // "pen", "eraser", "line", "rectangle", "circle"
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(true);
  const [isFilled, setIsFilled] = useState(false);

  // Color palette options
  const colorPalette = [
    "#000000", "#ffffff", "#ff3b30", "#ff9500", "#ffcc00", 
    "#4cd964", "#5ac8fa", "#007aff", "#5856d6", "#ff2d55"
  ];

  // JOIN ROOM
  useEffect(() => {
    if (roomId && socket) {
      socket.emit("join-room", roomId);
      console.log("🟢 Joined whiteboard room:", roomId);
    }
  }, [roomId, socket]);

  // INITIALIZE CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const temp = document.createElement("canvas");
      const tempCtx = temp.getContext("2d");
      
      // Save current drawing
      if (ctxRef.current) {
        temp.width = canvas.width;
        temp.height = canvas.height;
        tempCtx.drawImage(canvas, 0, 0);
      }

      // Set new dimensions
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = size;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      // Restore drawing
      if (temp.width > 0) {
        ctx.drawImage(temp, 0, 0);
      }
      ctxRef.current = ctx;
    };

    // Initial resize
    setTimeout(resize, 100);
    window.addEventListener("resize", resize);
    
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Update context when tool or color changes
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

  // RECEIVE DRAW FROM OTHER USER - FIXED FOR SHAPES
  useEffect(() => {
    if (!socket) return;

    const handleDraw = (data) => {
      console.log("📨 Received draw data:", data);
      drawOnCanvas(data);
    };

    const handleClear = () => {
      console.log("🗑️ Clearing whiteboard");
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
      }
    };

    socket.on("whiteboard-draw", handleDraw);
    socket.on("whiteboard-clear", handleClear);

    return () => {
      socket.off("whiteboard-draw", handleDraw);
      socket.off("whiteboard-clear", handleClear);
    };
  }, [socket]);

  // Draw on canvas (handles both freehand and shapes)
  const drawOnCanvas = useCallback((data) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    console.log("🎨 Drawing received:", data);

    const originalComposite = ctx.globalCompositeOperation;
    const originalStyle = ctx.strokeStyle;
    const originalFill = ctx.fillStyle;
    const originalWidth = ctx.lineWidth;

    // Set drawing properties based on data
    if (data.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.fillStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = data.color || "#000000";
      ctx.fillStyle = data.color || "#000000";
    }
    ctx.lineWidth = data.size || 4;

    // Draw based on tool type
    if (data.tool === "pen" || data.tool === "eraser") {
      // Freehand drawing
      ctx.beginPath();
      ctx.moveTo(data.lastX, data.lastY);
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    } else {
      // Shape drawing
      drawShape(ctx, data);
    }

    // Restore original context
    ctx.globalCompositeOperation = originalComposite;
    ctx.strokeStyle = originalStyle;
    ctx.fillStyle = originalFill;
    ctx.lineWidth = originalWidth;
  }, []);

  // Draw different shapes
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
        if (isFilled) {
          ctx.fillRect(startX, startY, width, height);
        } else {
          ctx.strokeRect(startX, startY, width, height);
        }
        break;

      case "circle":
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        const radiusX = Math.abs(endX - startX) / 2;
        const radiusY = Math.abs(endY - startY) / 2;
        const radius = Math.max(radiusX, radiusY);
        
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        if (isFilled) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
        break;

      default:
        break;
    }
  }, []);

  // Save canvas state to history
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height);
    
    if (historyIndex.current < drawingHistory.current.length - 1) {
      drawingHistory.current = drawingHistory.current.slice(0, historyIndex.current + 1);
    }

    drawingHistory.current.push(imageData);
    historyIndex.current = drawingHistory.current.length - 1;

    // Limit history to 50 states
    if (drawingHistory.current.length > 50) {
      drawingHistory.current.shift();
      historyIndex.current--;
    }
  }, []);

  // Undo functionality
  const undo = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current--;
      const imageData = drawingHistory.current[historyIndex.current];
      ctxRef.current.putImageData(imageData, 0, 0);
    } else if (historyIndex.current === 0) {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      historyIndex.current = -1;
      drawingHistory.current = [];
    }
  }, []);

  // Redo functionality
  const redo = useCallback(() => {
    if (historyIndex.current < drawingHistory.current.length - 1) {
      historyIndex.current++;
      const imageData = drawingHistory.current[historyIndex.current];
      ctxRef.current.putImageData(imageData, 0, 0);
    }
  }, []);

  // Get mouse/touch coordinates
  const getCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  // Freehand drawing functions
  const startFreehand = useCallback((x, y) => {
    if (!isDrawingEnabled) return;

    isDrawing.current = true;
    startPos.current = { x, y };
    
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [isDrawingEnabled]);

  const drawFreehand = useCallback((x, y) => {
    if (!isDrawing.current || !isDrawingEnabled) return;

    const ctx = ctxRef.current;
    
    ctx.lineTo(x, y);
    ctx.stroke();

    // SYNC TO SERVER - FIXED: Send proper data structure
    if (socket && roomId) {
      socket.emit("whiteboard-draw", {
        roomId,
        lastX: startPos.current.x,
        lastY: startPos.current.y,
        x,
        y,
        color,
        size,
        tool
      });
    }

    startPos.current = { x, y };
  }, [roomId, color, size, tool, socket, isDrawingEnabled]);

  // Shape drawing functions
  const startShape = useCallback((x, y) => {
    if (!isDrawingEnabled) return;

    isDrawing.current = true;
    startPos.current = { x, y };
    
    // Save state before starting shape for preview
    saveToHistory();
  }, [isDrawingEnabled, saveToHistory]);

  const drawCurrentShape = useCallback((x, y) => {
    if (!isDrawing.current || !isDrawingEnabled) return;

    const ctx = ctxRef.current;
    
    // Clear and redraw from history for preview
    if (historyIndex.current >= 0) {
      ctx.putImageData(drawingHistory.current[historyIndex.current], 0, 0);
    }

    // Draw the current shape preview
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
  }, [tool, isFilled, color, size, isDrawingEnabled, drawShape]);

  const finishShape = useCallback((x, y) => {
    if (!isDrawing.current) return;

    // Final draw
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

    // SYNC TO SERVER - FIXED: Send shape data using same event
    if (socket && roomId) {
      socket.emit("whiteboard-draw", {
        roomId,
        startX: startPos.current.x,
        startY: startPos.current.y,
        endX: x,
        endY: y,
        tool,
        isFilled,
        color,
        size
      });
    }

    saveToHistory();
    isDrawing.current = false;
  }, [roomId, tool, isFilled, color, size, socket, saveToHistory, drawShape]);

  // Event handlers
  const handleMouseDown = (e) => {
    const { x, y } = getCoordinates(e);

    if (tool === "pen" || tool === "eraser") {
      startFreehand(x, y);
    } else {
      startShape(x, y);
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getCoordinates(e);

    if (tool === "pen" || tool === "eraser") {
      drawFreehand(x, y);
    } else if (isDrawing.current) {
      drawCurrentShape(x, y);
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing.current) return;

    const { x, y } = getCoordinates(e);

    if (tool === "pen" || tool === "eraser") {
      stopDrawing();
    } else {
      finishShape(x, y);
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    if (tool === "pen" || tool === "eraser") {
      startFreehand(x, y);
    } else {
      startShape(x, y);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    if (tool === "pen" || tool === "eraser") {
      drawFreehand(x, y);
    } else if (isDrawing.current) {
      drawCurrentShape(x, y);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;

    const { x, y } = getCoordinates(e);

    if (tool === "pen" || tool === "eraser") {
      stopDrawing();
    } else {
      finishShape(x, y);
    }
  };

  const stopDrawing = useCallback(() => {
    if (isDrawing.current) {
      isDrawing.current = false;
      saveToHistory();
    }
  }, [saveToHistory]);

  // CLEAR CANVAS
  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveToHistory();

      if (socket && roomId) {
        socket.emit("whiteboard-clear", { roomId });
      }
    }
  };

  // DOWNLOAD CANVAS
  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId || 'drawing'}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const isFreehandTool = tool === "pen" || tool === "eraser";

  return (
    <div className="flex flex-col h-full bg-base-100 border-l border-base-300">
      {/* Toolbar */}
      <div className="p-3 flex flex-wrap gap-3 items-center border-b bg-base-200">
        {/* Tool Selection */}
        <div className="flex gap-1 bg-base-300 rounded-lg p-1">
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded ${tool === "pen" ? "bg-primary text-primary-content" : "hover:bg-base-100"}`}
            title="Pen"
          >
            ✏️
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded ${tool === "eraser" ? "bg-primary text-primary-content" : "hover:bg-base-100"}`}
            title="Eraser"
          >
            🧽
          </button>
          <button
            onClick={() => setTool("line")}
            className={`p-2 rounded ${tool === "line" ? "bg-primary text-primary-content" : "hover:bg-base-100"}`}
            title="Line"
          >
            📏
          </button>
          <button
            onClick={() => setTool("rectangle")}
            className={`p-2 rounded ${tool === "rectangle" ? "bg-primary text-primary-content" : "hover:bg-base-100"}`}
            title="Rectangle"
          >
            ⬜
          </button>
          <button
            onClick={() => setTool("circle")}
            className={`p-2 rounded ${tool === "circle" ? "bg-primary text-primary-content" : "hover:bg-base-100"}`}
            title="Circle"
          >
            ⭕
          </button>
        </div>

        {/* Color Palette */}
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
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded border border-base-300 cursor-pointer"
            title="Custom Color"
          />
        </div>

        {/* Brush Size Slider */}
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">
            {tool === "eraser" ? "Eraser Size" : "Brush Size"}:
          </span>
          <input
            type="range"
            min="2"
            max="25"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm w-8">{size}px</span>
        </div>

        {/* Fill Toggle for Shapes */}
        {!isFreehandTool && (
          <button
            onClick={() => setIsFilled(!isFilled)}
            className={`px-3 py-1 rounded ${isFilled ? "bg-primary text-primary-content" : "bg-base-300"}`}
            title={isFilled ? "Filled" : "Outline"}
          >
            {isFilled ? "🟦 Filled" : "⬜ Outline"}
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={undo}
            className="px-3 py-1 rounded bg-base-300 hover:bg-base-100 transition-colors"
            title="Undo"
          >
            ↩️ Undo
          </button>
          <button
            onClick={redo}
            className="px-3 py-1 rounded bg-base-300 hover:bg-base-100 transition-colors"
            title="Redo"
          >
            ↪️ Redo
          </button>
          <button
            onClick={() => setIsDrawingEnabled(!isDrawingEnabled)}
            className={`px-3 py-1 rounded transition-colors ${
              isDrawingEnabled ? "bg-success text-success-content" : "bg-error text-error-content"
            }`}
            title={isDrawingEnabled ? "Disable Drawing" : "Enable Drawing"}
          >
            {isDrawingEnabled ? "✅ Draw" : "🚫 Draw"}
          </button>
          <button
            onClick={downloadCanvas}
            className="px-3 py-1 rounded bg-info text-info-content hover:bg-info/80 transition-colors"
            title="Download"
          >
            💾 Save
          </button>
          <button
            onClick={clearBoard}
            className="px-3 py-1 rounded bg-error text-error-content hover:bg-error/80 transition-colors"
            title="Clear Board"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-gray-100 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-white touch-none cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* Status Bar */}
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