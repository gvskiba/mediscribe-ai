import { useRef, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const COLORS = ["#ff4444", "#00e5c0", "#f5c842", "#3b9eff", "#ffffff"];
const TOOLS = [
  { id: "pen",    label: "✏️", title: "Freehand" },
  { id: "arrow",  label: "➡", title: "Arrow" },
  { id: "circle", label: "⭕", title: "Circle" },
];

export default function DrawingOverlay({ src, alt, borderColor, saveTitle, saveProtocol }) {
  const canvasRef  = useRef(null);
  const imgRef     = useRef(null);
  const [tool,     setTool]     = useState("pen");
  const [color,    setColor]    = useState("#ff4444");
  const [drawing,  setDrawing]  = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [snapshot, setSnapshot] = useState(null); // for shape preview
  const [history,  setHistory]  = useState([]);
  const [saved,    setSaved]    = useState(false);
  const [saving,   setSaving]   = useState(false);

  // Resize canvas to match image display size
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    canvas.width  = img.clientWidth;
    canvas.height = img.clientHeight;
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    img.onload = syncCanvasSize;
    if (img.complete) syncCanvasSize();
    window.addEventListener("resize", syncCanvasSize);
    return () => window.removeEventListener("resize", syncCanvasSize);
  }, [syncCanvasSize]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    setHistory(prev => [...prev.slice(-19), canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const startDraw = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    saveHistory();
    setStartPos(pos);
    setDrawing(true);
    if (tool === "pen") {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else {
      setSnapshot(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
    }
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";

    if (tool === "pen") {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === "arrow") {
      ctx.putImageData(snapshot, 0, 0);
      drawArrow(ctx, startPos.x, startPos.y, pos.x, pos.y);
    } else if (tool === "circle") {
      ctx.putImageData(snapshot, 0, 0);
      const rx = Math.abs(pos.x - startPos.x) / 2;
      const ry = Math.abs(pos.y - startPos.y) / 2;
      const cx = startPos.x + (pos.x - startPos.x) / 2;
      const cy = startPos.y + (pos.y - startPos.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const endDraw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    setDrawing(false);
    setStartPos(null);
    setSnapshot(null);
    if (tool === "pen") canvasRef.current.getContext("2d").closePath();
  };

  const drawArrow = (ctx, x1, y1, x2, y2) => {
    const headLen = 14;
    const angle   = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  const undo = () => {
    if (!history.length) return;
    const ctx = canvasRef.current.getContext("2d");
    const prev = history[history.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory(h => h.slice(0, -1));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    saveHistory();
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveToGallery = async () => {
    setSaving(true);
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    // Merge image + drawing onto a temp canvas
    const temp = document.createElement("canvas");
    temp.width  = img.naturalWidth  || canvas.width;
    temp.height = img.naturalHeight || canvas.height;
    const ctx = temp.getContext("2d");
    ctx.drawImage(img, 0, 0, temp.width, temp.height);
    ctx.drawImage(canvas, 0, 0, temp.width, temp.height);
    const dataUrl = temp.toDataURL("image/png");
    await base44.entities.POCUSAnnotation.create({
      title: saveTitle || alt || "POCUS Finding",
      image_data: dataUrl,
      protocol: saveProtocol || "",
      diagnosis_tags: [],
      notes: "",
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const btn = (active, onClick, children, title) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: "4px 9px", borderRadius: 6, fontSize: 13, cursor: "pointer",
        background: active ? "rgba(0,229,192,0.2)" : "rgba(14,37,68,0.8)",
        border: `1px solid ${active ? "rgba(0,229,192,0.5)" : "rgba(42,79,122,0.5)"}`,
        color: active ? "#00e5c0" : "#8aaccc",
        transition: "all 0.15s",
      }}
    >{children}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", padding: "5px 8px", background: "rgba(8,22,40,0.85)", borderRadius: 8, border: "1px solid rgba(42,79,122,0.4)" }}>
        {TOOLS.map(t => btn(tool === t.id, () => setTool(t.id), t.label, t.title))}
        <div style={{ width: 1, height: 18, background: "rgba(42,79,122,0.5)", margin: "0 3px" }} />
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)} title={c}
            style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: `2px solid ${color === c ? "#fff" : "transparent"}`, cursor: "pointer", padding: 0, flexShrink: 0 }} />
        ))}
        <div style={{ width: 1, height: 18, background: "rgba(42,79,122,0.5)", margin: "0 3px" }} />
        {btn(false, undo,  "↩ Undo",  "Undo")}
        {btn(false, clear, "🗑 Clear", "Clear all")}
        <div style={{ width: 1, height: 18, background: "rgba(42,79,122,0.5)", margin: "0 3px" }} />
        <button onClick={saveToGallery} disabled={saving || saved}
          style={{ padding: "4px 11px", borderRadius: 6, fontSize: 12, cursor: "pointer", background: saved ? "rgba(61,255,160,0.2)" : "rgba(0,229,192,0.15)", border: `1px solid ${saved ? "rgba(61,255,160,0.5)" : "rgba(0,229,192,0.4)"}`, color: saved ? "#3dffa0" : "#00e5c0", fontWeight: 600, transition: "all 0.15s" }}>
          {saving ? "Saving…" : saved ? "✓ Saved!" : "💾 Save to Gallery"}
        </button>
      </div>

      {/* Image + Canvas */}
      <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1px solid ${borderColor || "rgba(42,79,122,0.4)"}` }}>
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          style={{ width: "100%", aspectRatio: "180/110", objectFit: "cover", display: "block" }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, cursor: tool === "pen" ? "crosshair" : "crosshair", touchAction: "none" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#2e4a6a", textAlign: "center" }}>
        Draw directly on the image · Pen · Arrow · Circle · Undo / Clear
      </div>
    </div>
  );
}