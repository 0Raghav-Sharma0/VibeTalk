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
    }
  }, [roomId, socket]);

  // INITIALIZE CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const temp = document.createElement("canvas");
      const tempCtx = temp.getContext("2d");
      temp.width = canvas.width;
      temp.height = canvas.height;
      
      // Save current drawing
      if (ctxRef.current) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      // Set new dimensions
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = size;

      // Restore drawing
      ctx.drawImage(temp, 0, 0);
      ctxRef.current = ctx;
    };

    resize();
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

  // RECEIVE DRAW FROM OTHER USER
  useEffect(() => {
    if (!socket) return;

    const handleDraw = (data) => {
      drawOnCanvas(data);
    };

    const handleShape = (data) => {
      drawShapeOnCanvas(data);
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
      }
    };

    socket.on("whiteboard-draw", handleDraw);
    socket.on("whiteboard-shape", handleShape);
    socket.on("whiteboard-clear", handleClear);

    return () => {
      socket.off("whiteboard-draw", handleDraw);
      socket.off("whiteboard-shape", handleShape);
      socket.off("whiteboard-clear", handleClear);
    };
  }, [socket]);

  // Draw freehand on canvas
  const drawOnCanvas = useCallback((data) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const originalComposite = ctx.globalCompositeOperation;
    const originalStyle = ctx.strokeStyle;

    if (data.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = data.color;
    }
    ctx.lineWidth = data.size;

    ctx.beginPath();
    ctx.moveTo(data.lastX, data.lastY);
    ctx.lineTo(data.x, data.y);
    ctx.stroke();

    ctx.globalCompositeOperation = originalComposite;
    ctx.strokeStyle = originalStyle;
  }, []);

  // Draw shape on canvas
  const drawShapeOnCanvas = useCallback((data) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const originalComposite = ctx.globalCompositeOperation;
    const originalStyle = ctx.strokeStyle;
    const originalFill = ctx.fillStyle;

    if (data.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.fillStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = data.color;
      ctx.fillStyle = data.color;
    }
    ctx.lineWidth = data.size;

    drawShape(ctx, data);

    ctx.globalCompositeOperation = originalComposite;
    ctx.strokeStyle = originalStyle;
    ctx.fillStyle = originalFill;
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
        const radius = Math.sqrt(width * width + height * height) / 2;
        const centerX = startX + width / 2;
        const centerY = startY + height / 2;
        
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

    // SYNC TO SERVER
    if (socket) {
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
  }, [isDrawingEnabled]);

  const drawCurrentShape = useCallback((x, y) => {
    if (!isDrawing.current || !isDrawingEnabled) return;

    const ctx = ctxRef.current;
    
    // Clear and redraw from history for preview
    if (historyIndex.current >= 0) {
      ctx.putImageData(drawingHistory.current[historyIndex.current], 0, 0);
    } else {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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
  }, [tool, isFilled, color, size, isDrawingEnabled]);

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

    // SYNC TO SERVER
    if (socket) {
      socket.emit("whiteboard-shape", {
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
  }, [roomId, tool, isFilled, color, size, socket, saveToHistory]);

  // Event handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pen" || tool === "eraser") {
      startFreehand(x, y);
    } else {
      startShape(x, y);
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pen" || tool === "eraser") {
      drawFreehand(x, y);
    } else if (isDrawing.current) {
      drawCurrentShape(x, y);
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pen" || tool === "eraser") {
      stopDrawing();
    } else {
      finishShape(x, y);
      isDrawing.current = false;
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (tool === "pen" || tool === "eraser") {
      startFreehand(x, y);
    } else {
      startShape(x, y);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (tool === "pen" || tool === "eraser") {
      drawFreehand(x, y);
    } else if (isDrawing.current) {
      drawCurrentShape(x, y);
    }
  };

  const handleTouchEnd = (e) => {
    if (!isDrawing.current) return;

    const touch = e.changedTouches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (tool === "pen" || tool === "eraser") {
      stopDrawing();
    } else {
      finishShape(x, y);
      isDrawing.current = false;
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();

    if (socket) {
      socket.emit("whiteboard-clear", { roomId });
    }
  };

  // DOWNLOAD CANVAS
  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
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
            className="w-8 h-8 p-0 rounded border-0"
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
            {isFilled ? "🟦" : "⬜"}
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={undo}
            className="px-3 py-1 rounded bg-base-300 hover:bg-base-100"
            title="Undo"
          >
            ↩️
          </button>
          <button
            onClick={redo}
            className="px-3 py-1 rounded bg-base-300 hover:bg-base-100"
            title="Redo"
          >
            ↪️
          </button>
          <button
            onClick={() => setIsDrawingEnabled(!isDrawingEnabled)}
            className={`px-3 py-1 rounded ${
              isDrawingEnabled ? "bg-success text-success-content" : "bg-error text-error-content"
            }`}
            title={isDrawingEnabled ? "Disable Drawing" : "Enable Drawing"}
          >
            {isDrawingEnabled ? "✅" : "🚫"}
          </button>
          <button
            onClick={downloadCanvas}
            className="px-3 py-1 rounded bg-info text-info-content"
            title="Download"
          >
            💾
          </button>
          <button
            onClick={clearBoard}
            className="px-3 py-1 rounded bg-error text-error-content"
            title="Clear Board"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 bg-white touch-none cursor-crosshair"
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