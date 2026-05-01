import { useState, useRef, useCallback, useEffect } from "react";

const COMPONENT_TYPES = [
  { type: "client", label: "Client", color: "#3B82F6" },
  { type: "server", label: "Server", color: "#8B5CF6" },
  { type: "database", label: "Database", color: "#10B981" },
  { type: "cache", label: "Cache", color: "#F59E0B" },
  { type: "queue", label: "Queue", color: "#EF4444" },
  { type: "loadbalancer", label: "Load Balancer", color: "#06B6D4" },
  { type: "cdn", label: "CDN", color: "#EC4899" },
  { type: "storage", label: "Object Store", color: "#84CC16" },
  { type: "custom", label: "Custom", color: "#6B7280" },
];

const PHASE_HINTS = {
  clarify: "Jot down requirements as you clarify them — use the Note tool for multi-line text",
  api_design: "Sketch your API endpoints, request/response shapes, and schemas",
  design: "Draw your high-level system architecture",
  deep_dive: "",
  scale: "",
};

/** Perpendicular distance from point to line segment */
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** Find where a ray from box center at `angle` hits the box border */
function boxEdgePoint(box, angle) {
  const hw = box.w / 2, hh = box.h / 2;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const scaleX = Math.abs(cos) > 1e-9 ? hw / Math.abs(cos) : Infinity;
  const scaleY = Math.abs(sin) > 1e-9 ? hh / Math.abs(sin) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return { x: box.x + hw + cos * scale, y: box.y + hh + sin * scale };
}

/** Compute rendered arrow endpoints that terminate exactly at box borders */
function arrowEndpoints(from, to) {
  const fx = from.x + from.w / 2, fy = from.y + from.h / 2;
  const tx = to.x + to.w / 2, ty = to.y + to.h / 2;
  const angle = Math.atan2(ty - fy, tx - fx);
  const start = boxEdgePoint(from, angle);
  const end = boxEdgePoint(to, angle + Math.PI);
  return { startX: start.x, startY: start.y, endX: end.x, endY: end.y };
}

export default function Canvas({ onSnapshot, elements, setElements, phase = "design" }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("select");
  const [dragTarget, setDragTarget] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [freehandPath, setFreehandPath] = useState([]);
  const [selectedEl, setSelectedEl] = useState(null);
  const [editingText, setEditingText] = useState(null);   // free-floating label
  const [editingLabel, setEditingLabel] = useState(null); // component rename
  const [editingNote, setEditingNote] = useState(null);   // multi-line note
  const [connectionStart, setConnectionStart] = useState(null);
  const [connectPreviewPos, setConnectPreviewPos] = useState(null);
  const [resizingNote, setResizingNote] = useState(null);
  const [resizeOrigin, setResizeOrigin] = useState(null);

  // ─── Undo/Redo ───────────────────────────────────────────────────
  const historyRef = useRef([[]]);
  const historyIdxRef = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const lastDragElementsRef = useRef(null);
  const lastClickRef = useRef({ id: null, time: 0 });

  // For stable keyboard refs
  const elementsRef = useRef(elements);
  const selectedElRef = useRef(selectedEl);
  const clipboardRef = useRef(null);
  const lastMousePosRef = useRef(null);

  useEffect(() => { elementsRef.current = elements; }, [elements]);
  useEffect(() => { selectedElRef.current = selectedEl; }, [selectedEl]);

  useEffect(() => {
    historyRef.current = [elements.slice()];
    historyIdxRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pushHistory = useCallback((newElements) => {
    const idx = historyIdxRef.current;
    historyRef.current = [...historyRef.current.slice(0, idx + 1), newElements.slice()];
    historyIdxRef.current = historyRef.current.length - 1;
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    setElements(historyRef.current[historyIdxRef.current].slice());
    setSelectedEl(null);
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(true);
  }, [setElements]);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    setElements(historyRef.current[historyIdxRef.current].slice());
    setSelectedEl(null);
    setCanUndo(true);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
  }, [setElements]);

  const deleteSelected = useCallback(() => {
    if (!selectedEl) return;
    const newElements = elements.filter(
      (el) =>
        el.id !== selectedEl &&
        !(el.kind === "arrow" && (el.from === selectedEl || el.to === selectedEl))
    );
    setElements(newElements);
    pushHistory(newElements);
    setSelectedEl(null);
  }, [selectedEl, elements, setElements, pushHistory]);

  const clearCanvas = useCallback(() => {
    setElements([]);
    pushHistory([]);
    setSelectedEl(null);
    setConnectionStart(null);
    setConnectPreviewPos(null);
  }, [setElements, pushHistory]);

  // Copy selected element to clipboard
  const copySelected = useCallback(() => {
    const id = selectedElRef.current;
    if (!id) return;
    const el = elementsRef.current.find((e) => e.id === id);
    if (el && el.kind !== "arrow") {
      clipboardRef.current = { ...el }; // shallow copy is fine (no nested refs)
    }
  }, []);

  // Paste from clipboard at last cursor position
  const pasteFromClipboard = useCallback(() => {
    const src = clipboardRef.current;
    if (!src) return;
    const pos = lastMousePosRef.current;
    const newEl = {
      ...src,
      id: Date.now(),
      // Center on cursor if we have position; else offset from original
      ...(pos && src.w && src.h
        ? { x: pos.x - src.w / 2, y: pos.y - src.h / 2 }
        : pos
        ? { x: pos.x, y: pos.y }
        : { x: src.x + 30, y: src.y + 30 }),
    };
    const next = [...elementsRef.current, newEl];
    setElements(next);
    pushHistory(next);
    setSelectedEl(newEl.id);
  }, [setElements, pushHistory]);

  // ─── Stable keyboard-handler refs ────────────────────────────────
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  const deleteRef = useRef(deleteSelected);
  const copyRef = useRef(copySelected);
  const pasteRef = useRef(pasteFromClipboard);
  useEffect(() => { undoRef.current = undo; }, [undo]);
  useEffect(() => { redoRef.current = redo; }, [redo]);
  useEffect(() => { deleteRef.current = deleteSelected; }, [deleteSelected]);
  useEffect(() => { copyRef.current = copySelected; }, [copySelected]);
  useEffect(() => { pasteRef.current = pasteFromClipboard; }, [pasteFromClipboard]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const ctrl = e.metaKey || e.ctrlKey;
      if (ctrl) {
        if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undoRef.current(); return; }
        if ((e.key === "z" && e.shiftKey) || e.key === "y") { e.preventDefault(); redoRef.current(); return; }
        if (e.key === "c") { e.preventDefault(); copyRef.current(); return; }
        if (e.key === "v") { e.preventDefault(); pasteRef.current(); return; }
      }
      if (!ctrl && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        deleteRef.current();
      }
      if (e.key === "Escape") {
        setConnectionStart(null);
        setConnectPreviewPos(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ─── Pointer helpers ──────────────────────────────────────────────
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // Finds any box-shaped element (component, note, or text label) at position
  const findBoxAt = (pos) =>
    [...elements].reverse().find((el) => {
      if (el.kind === "component" || el.kind === "note") {
        return pos.x >= el.x && pos.x <= el.x + el.w &&
               pos.y >= el.y && pos.y <= el.y + el.h;
      }
      if (el.kind === "text") {
        // SVG text y is the baseline; hit box is baseline-adjusted
        const w = el.w || (el.text?.length || 5) * 8 + 8;
        return pos.x >= el.x && pos.x <= el.x + w &&
               pos.y >= el.y - 16 && pos.y <= el.y + 4;
      }
      return false;
    });

  const findArrowAt = (pos) =>
    elements.find((el) => {
      if (el.kind !== "arrow") return false;
      const from = elements.find((e) => e.id === el.from);
      const to = elements.find((e) => e.id === el.to);
      if (!from || !to) return false;
      const { startX, startY, endX, endY } = arrowEndpoints(from, to);
      return distToSegment(pos.x, pos.y, startX, startY, endX, endY) < 9;
    });

  // Finds a note whose resize handle (bottom-right 14px square) is at pos
  const findResizeHandle = (pos) =>
    elements.find(
      (el) =>
        el.kind === "note" &&
        pos.x >= el.x + el.w - 14 && pos.x <= el.x + el.w + 4 &&
        pos.y >= el.y + el.h - 14 && pos.y <= el.y + el.h + 4
    );

  // ─── Add component ───────────────────────────────────────────────
  const addComponent = (type) => {
    const comp = COMPONENT_TYPES.find((c) => c.type === type);
    const newEl = {
      id: Date.now(),
      kind: "component",
      type,
      label: comp.label,
      color: comp.color,
      x: 150 + Math.random() * 300,
      y: 100 + Math.random() * 200,
      w: 130,
      h: 60,
    };
    const next = [...elements, newEl];
    setElements(next);
    pushHistory(next);
    setTool("select");
    // Custom component opens rename editor immediately so user can type their own label
    if (type === "custom") setEditingLabel(newEl.id);
  };

  // ─── Pointer events ───────────────────────────────────────────────
  const handlePointerDown = (e) => {
    const pos = getPos(e);

    if (tool === "connect") {
      const target = findBoxAt(pos);
      if (target) {
        if (connectionStart && connectionStart.id !== target.id) {
          const newEl = { id: Date.now(), kind: "arrow", from: connectionStart.id, to: target.id };
          const next = [...elements, newEl];
          setElements(next);
          pushHistory(next);
          setConnectionStart(null);
          setConnectPreviewPos(null);
        } else {
          setConnectionStart(target);
          setConnectPreviewPos({ x: target.x + target.w / 2, y: target.y + target.h / 2 });
        }
      } else {
        setConnectionStart(null);
        setConnectPreviewPos(null);
      }
      return;
    }

    if (tool === "select") {
      // 1. Resize handle check (notes only)
      const resizeTarget = findResizeHandle(pos);
      if (resizeTarget) {
        setResizingNote(resizeTarget.id);
        setResizeOrigin({ x: pos.x, y: pos.y, w: resizeTarget.w, h: resizeTarget.h });
        setSelectedEl(resizeTarget.id);
        lastDragElementsRef.current = null;
        return;
      }

      // 2. Box check (component or note)
      const box = findBoxAt(pos);
      if (box) {
        const now = Date.now();
        if (lastClickRef.current.id === box.id && now - lastClickRef.current.time < 400) {
          // Double-click
          if (box.kind === "note") setEditingNote(box.id);
          else if (box.kind === "text") setEditingText(box.id);
          else setEditingLabel(box.id);
          setDragTarget(null);
          lastClickRef.current = { id: null, time: 0 };
          return;
        }
        lastClickRef.current = { id: box.id, time: now };
        setDragTarget(box.id);
        setDragOffset({ x: pos.x - box.x, y: pos.y - box.y });
        setSelectedEl(box.id);
        lastDragElementsRef.current = null;
        return;
      }

      // 3. Arrow check
      const arrow = findArrowAt(pos);
      if (arrow) {
        setSelectedEl(arrow.id);
        lastClickRef.current = { id: null, time: 0 };
        return;
      }

      // 4. Freehand check (segment proximity)
      const freehand = elements.slice().reverse().find((el) => {
        if (el.kind !== "freehand") return false;
        for (let i = 0; i < el.points.length - 1; i++) {
          if (distToSegment(pos.x, pos.y, el.points[i].x, el.points[i].y, el.points[i + 1].x, el.points[i + 1].y) < 8)
            return true;
        }
        return false;
      });
      if (freehand) {
        setSelectedEl(freehand.id);
        lastClickRef.current = { id: null, time: 0 };
        return;
      }

      setSelectedEl(null);
      lastClickRef.current = { id: null, time: 0 };
    }

    if (tool === "draw") {
      setIsDrawing(true);
      setFreehandPath([pos]);
    }

    if (tool === "text") {
      const newEl = { id: Date.now(), kind: "text", text: "Label", x: pos.x, y: pos.y, w: 60, h: 20 };
      const next = [...elements, newEl];
      setElements(next);
      pushHistory(next);
      setEditingText(newEl.id);
      setTool("select");
    }

    if (tool === "note") {
      const newEl = {
        id: Date.now(),
        kind: "note",
        text: "",
        x: pos.x,
        y: pos.y,
        w: 220,
        h: 140,
      };
      const next = [...elements, newEl];
      setElements(next);
      pushHistory(next);
      setEditingNote(newEl.id);
      setTool("select");
    }
  };

  const handlePointerMove = (e) => {
    const pos = getPos(e);
    lastMousePosRef.current = pos;

    if (dragTarget) {
      const newX = pos.x - dragOffset.x;
      const newY = pos.y - dragOffset.y;
      setElements((prev) => {
        const updated = prev.map((el) =>
          el.id === dragTarget ? { ...el, x: newX, y: newY } : el
        );
        lastDragElementsRef.current = updated;
        return updated;
      });
    }

    if (resizingNote && resizeOrigin) {
      const newW = Math.max(120, resizeOrigin.w + (pos.x - resizeOrigin.x));
      const newH = Math.max(80, resizeOrigin.h + (pos.y - resizeOrigin.y));
      setElements((prev) => {
        const updated = prev.map((el) =>
          el.id === resizingNote ? { ...el, w: newW, h: newH } : el
        );
        lastDragElementsRef.current = updated;
        return updated;
      });
    }

    if (tool === "connect" && connectionStart) {
      setConnectPreviewPos(pos);
    }

    if (isDrawing && tool === "draw") {
      setFreehandPath((prev) => [...prev, pos]);
    }
  };

  const handlePointerUp = () => {
    if (dragTarget || resizingNote) {
      if (lastDragElementsRef.current) {
        pushHistory(lastDragElementsRef.current.slice());
        lastDragElementsRef.current = null;
      }
      setDragTarget(null);
      setResizingNote(null);
      setResizeOrigin(null);
    }

    if (isDrawing && freehandPath.length > 1) {
      const newEl = { id: Date.now(), kind: "freehand", points: [...freehandPath] };
      const next = [...elements, newEl];
      setElements(next);
      pushHistory(next);
      setFreehandPath([]);
    }
    setIsDrawing(false);
  };

  // ─── Canvas description for AI ───────────────────────────────────
  const getCanvasDescription = useCallback(() => {
    const components = elements.filter((e) => e.kind === "component");
    const arrows = elements.filter((e) => e.kind === "arrow");
    const texts = elements.filter((e) => e.kind === "text");
    const notes = elements.filter((e) => e.kind === "note" && e.text?.trim());

    if (components.length === 0 && texts.length === 0 && notes.length === 0) return "";

    let desc = components.length > 0
      ? "Components: " + components.map((c) => c.label).join(", ")
      : "";

    if (arrows.length > 0) {
      desc += ". Connections: " +
        arrows.map((a) => {
          const from = elements.find((c) => c.id === a.from);
          const to = elements.find((c) => c.id === a.to);
          return from && to ? `${from.label} → ${to.label}` : "";
        }).filter(Boolean).join(", ");
    }

    if (notes.length > 0) {
      desc += ". Notes: " +
        notes.map((n) => `"${n.text.replace(/\n/g, " / ").trim()}"`).join(" | ");
    }

    if (texts.length > 0) {
      desc += ". Labels: " + texts.map((t) => t.text).filter(Boolean).join(", ");
    }

    return desc;
  }, [elements]);

  useEffect(() => {
    if (onSnapshot) onSnapshot(getCanvasDescription);
  }, [getCanvasDescription, onSnapshot]);

  // ─── Toolbar button ───────────────────────────────────────────────
  const ToolBtn = ({ name, label, amber }) => (
    <button
      onClick={() => {
        setTool(name);
        if (name !== "connect") { setConnectionStart(null); setConnectPreviewPos(null); }
      }}
      className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
        tool === name
          ? amber
            ? "border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-500/10"
            : "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/10"
          : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {label}
    </button>
  );

  // ─── Render elements ──────────────────────────────────────────────
  const renderElement = (el) => {
    if (el.kind === "component") {
      const isSelected = selectedEl === el.id;
      const isSource = connectionStart?.id === el.id;
      return (
        <g key={el.id}>
          {isSource && (
            <rect x={el.x - 4} y={el.y - 4} width={el.w + 8} height={el.h + 8} rx="12"
              fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="6,3" opacity="0.7" />
          )}
          <rect x={el.x} y={el.y} width={el.w} height={el.h} rx="8"
            fill={el.color + "18"}
            stroke={isSelected ? el.color : el.color + "60"}
            strokeWidth={isSelected ? 2.5 : 1.5} />
          <rect x={el.x} y={el.y} width={el.w} height="4" rx="2" fill={el.color} />
          <text x={el.x + el.w / 2} y={el.y + el.h / 2 + 5}
            textAnchor="middle" dominantBaseline="central"
            fontSize="13" fontWeight="500" fill="var(--color-text-primary, #1a1a1a)">
            {el.label}
          </text>
        </g>
      );
    }

    if (el.kind === "note") {
      const isSelected = selectedEl === el.id;
      const lines = (el.text || "").split("\n");
      const clipId = `clip-note-${el.id}`;
      return (
        <g key={el.id} style={{ cursor: "default" }}>
          {/* Shadow */}
          <rect x={el.x + 3} y={el.y + 3} width={el.w} height={el.h} rx="6"
            fill="rgba(0,0,0,0.06)" />
          {/* Note body */}
          <rect x={el.x} y={el.y} width={el.w} height={el.h} rx="6"
            fill="#FEFCE8"
            stroke={isSelected ? "#F59E0B" : "#FDE68A"}
            strokeWidth={isSelected ? 2 : 1} />
          {/* Header strip */}
          <rect x={el.x} y={el.y} width={el.w} height="20" rx="6" fill="#FEF08A" />
          <rect x={el.x} y={el.y + 14} width={el.w} height="6" fill="#FEF08A" />

          {/* Clipped text area */}
          <defs>
            <clipPath id={clipId}>
              <rect x={el.x + 1} y={el.y + 22} width={el.w - 2} height={el.h - 28} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            {el.text?.trim() ? (
              lines.map((line, i) => (
                <text key={i} x={el.x + 8} y={el.y + 34 + i * 15}
                  fontSize="11.5" fill="#713F12" fontFamily="ui-monospace, monospace"
                  style={{ whiteSpace: "pre" }}>
                  {line}
                </text>
              ))
            ) : (
              <text x={el.x + 8} y={el.y + 36}
                fontSize="11.5" fill="#D97706" fontStyle="italic">
                Double-click to edit…
              </text>
            )}
          </g>

          {/* Resize handle triangle */}
          <polygon
            points={`${el.x + el.w - 12},${el.y + el.h} ${el.x + el.w},${el.y + el.h} ${el.x + el.w},${el.y + el.h - 12}`}
            fill={isSelected ? "#F59E0B" : "#FDE68A"}
            style={{ cursor: "se-resize" }}
          />
        </g>
      );
    }

    if (el.kind === "arrow") {
      const from = elements.find((e) => e.id === el.from);
      const to = elements.find((e) => e.id === el.to);
      if (!from || !to) return null;
      const { startX, startY, endX, endY } = arrowEndpoints(from, to);
      const isSelected = selectedEl === el.id;
      return (
        <g key={el.id} style={{ cursor: "pointer" }}>
          <line x1={startX} y1={startY} x2={endX} y2={endY}
            stroke="transparent" strokeWidth="16" />
          {isSelected && (
            <line x1={startX} y1={startY} x2={endX} y2={endY}
              stroke="#93C5FD" strokeWidth="5" opacity="0.4" />
          )}
          <line x1={startX} y1={startY} x2={endX} y2={endY}
            stroke={isSelected ? "#3B82F6" : "var(--color-text-secondary, #6b6b6b)"}
            strokeWidth={isSelected ? 2 : 1.5}
            markerEnd={isSelected ? "url(#arrowhead-sel)" : "url(#arrowhead)"} />
        </g>
      );
    }

    if (el.kind === "freehand" && el.points.length > 1) {
      const isSelected = selectedEl === el.id;
      const d = `M ${el.points[0].x} ${el.points[0].y} ` +
        el.points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
      return (
        <g key={el.id}>
          {/* Wider transparent hit area */}
          <path d={d} fill="none" stroke="transparent" strokeWidth="16" />
          {isSelected && (
            <path d={d} fill="none" stroke="#93C5FD" strokeWidth="6" opacity="0.4"
              strokeLinecap="round" strokeLinejoin="round" />
          )}
          <path d={d} fill="none"
            stroke={isSelected ? "#3B82F6" : "var(--color-text-secondary, #6b6b6b)"}
            strokeWidth={isSelected ? 2.5 : 2}
            strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    }

    if (el.kind === "text") {
      if (editingText === el.id) return null;
      const isSelected = selectedEl === el.id;
      const w = el.w || (el.text?.length || 5) * 8 + 8;
      return (
        <g key={el.id} style={{ cursor: "default" }}>
          {/* Transparent hit area for easy click/drag */}
          <rect x={el.x - 2} y={el.y - 16} width={w + 4} height={20} fill="transparent" />
          {isSelected && (
            <rect x={el.x - 2} y={el.y - 16} width={w + 4} height={20} rx="3"
              fill="#3B82F6" fillOpacity="0.1" stroke="#3B82F6" strokeWidth="1" />
          )}
          <text x={el.x} y={el.y} fontSize="14"
            fill={isSelected ? "#3B82F6" : "var(--color-text-primary, #1a1a1a)"}
            onDoubleClick={() => setEditingText(el.id)}
            style={{ cursor: "pointer", userSelect: "none" }}>
            {el.text}
          </text>
        </g>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border-b border-gray-100 dark:border-gray-800 flex-wrap items-center bg-gray-50 dark:bg-gray-900">
        <ToolBtn name="select" label="Select" />
        <ToolBtn name="draw" label="Draw" />
        <ToolBtn name="connect" label="Connect" />
        <ToolBtn name="text" label="Label" />
        <ToolBtn name="note" label="Note" amber />

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {COMPONENT_TYPES.map((c) => (
          <button key={c.type} onClick={() => addComponent(c.type)}
            className="px-2 py-1 text-[11px] rounded-md border border-gray-200 dark:border-gray-700 font-medium hover:opacity-80 transition-opacity"
            style={{ background: c.color + "12", color: c.color }}>
            {c.label}
          </button>
        ))}

        <div className="flex-1" />

        <button onClick={undo} disabled={!canUndo} title="Undo (⌘Z)"
          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
            canUndo
              ? "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              : "border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed"
          }`}>Undo</button>
        <button onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)"
          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
            canRedo
              ? "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              : "border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed"
          }`}>Redo</button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {selectedEl && (
          <button onClick={deleteSelected}
            className="px-2.5 py-1 text-xs rounded-md border border-red-200 bg-red-50 text-red-500 dark:bg-red-500/10 dark:border-red-500/30">
            Delete
          </button>
        )}
        {elements.length > 0 && !selectedEl && (
          <button onClick={clearCanvas}
            className="px-2.5 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Connect mode hint */}
      {tool === "connect" && (
        <div className="px-3 py-1.5 text-[11px] text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400 border-b border-sky-100 dark:border-sky-500/20">
          {connectionStart
            ? `Click a target to connect from "${connectionStart.label}" — or click empty space to cancel`
            : "Click a component to start a connection"}
        </div>
      )}

      {/* Canvas SVG */}
      <div className="flex-1 relative overflow-hidden">
        {/* Empty-state hint — always centered in the visible viewport */}
        {elements.length === 0 && PHASE_HINTS[phase] && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="text-sm text-gray-400 dark:text-gray-600 select-none text-center px-8">
              {PHASE_HINTS[phase]}
            </span>
          </div>
        )}

        {/* Scrollable canvas area */}
        <div className="absolute inset-0 overflow-auto">
          <div className="relative" style={{ width: 2400, height: 1600 }}>
            <svg ref={canvasRef} className="canvas-grid absolute inset-0" width="2400" height="1600"
              style={{ cursor: (tool === "draw" || tool === "connect") ? "crosshair" : "default" }}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}>
              <defs>
                <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M2 1L8 5L2 9" fill="none"
                    stroke="var(--color-text-secondary, #6b6b6b)"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
                <marker id="arrowhead-sel" viewBox="0 0 10 10" refX="8" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M2 1L8 5L2 9" fill="none" stroke="#3B82F6"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
              </defs>

              {elements.map(renderElement)}

              {/* Live connection preview */}
              {connectionStart && connectPreviewPos && (
                <line
                  x1={connectionStart.x + connectionStart.w / 2}
                  y1={connectionStart.y + connectionStart.h / 2}
                  x2={connectPreviewPos.x} y2={connectPreviewPos.y}
                  stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="7,4"
                  opacity="0.65" style={{ pointerEvents: "none" }} />
              )}

              {/* Freehand preview */}
              {isDrawing && freehandPath.length > 1 && (
                <path
                  d={`M ${freehandPath[0].x} ${freehandPath[0].y} ` +
                    freehandPath.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")}
                  fill="none" stroke="var(--color-text-secondary, #6b6b6b)"
                  strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>

        {/* Inline label editor (free text) */}
        {editingText && (() => {
          const el = elements.find((e) => e.id === editingText);
          if (!el) return null;
          return (
            <input
              ref={(node) => { if (node) setTimeout(() => node.focus(), 50); }}
              defaultValue={el.text}
              onBlur={(e) => {
                const newText = e.target.value;
                const newElements = elements.map((item) =>
                  item.id === editingText
                    ? { ...item, text: newText, w: Math.max(60, newText.length * 8 + 8) }
                    : item
                );
                setElements(newElements);
                pushHistory(newElements);
                setEditingText(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.target.blur();
                if (e.key === "Escape") setEditingText(null);
              }}
              className="absolute text-sm border-2 border-blue-500 rounded px-1.5 py-0.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none"
              style={{ left: el.x, top: el.y - 10, minWidth: "80px" }} />
          );
        })()}

        {/* Component label editor (double-click rename) */}
        {editingLabel && (() => {
          const el = elements.find((e) => e.id === editingLabel);
          if (!el || el.kind !== "component") return null;
          return (
            <input
              ref={(node) => { if (node) setTimeout(() => node.focus(), 50); }}
              defaultValue={el.label}
              onBlur={(ev) => {
                const newLabel = ev.target.value.trim() || el.label;
                const newElements = elements.map((item) =>
                  item.id === editingLabel ? { ...item, label: newLabel } : item
                );
                setElements(newElements);
                pushHistory(newElements);
                setEditingLabel(null);
              }}
              onKeyDown={(ev) => {
                if (ev.key === "Enter") ev.target.blur();
                if (ev.key === "Escape") setEditingLabel(null);
              }}
              className="absolute text-sm border-2 border-blue-500 rounded px-2 py-0.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none text-center font-medium"
              style={{ left: el.x + 4, top: el.y + el.h / 2 - 14, width: el.w - 8 }} />
          );
        })()}

        {/* Note multi-line editor (double-click or on create) */}
        {editingNote && (() => {
          const el = elements.find((e) => e.id === editingNote);
          if (!el || el.kind !== "note") return null;
          return (
            <textarea
              ref={(node) => { if (node) setTimeout(() => node.focus(), 50); }}
              defaultValue={el.text}
              placeholder="Write requirements, APIs, or notes here...&#10;Enter for new line · Ctrl+Enter or Esc to close"
              onMouseDown={(ev) => ev.stopPropagation()}
              onBlur={(ev) => {
                const newElements = elements.map((item) =>
                  item.id === editingNote ? { ...item, text: ev.target.value } : item
                );
                setElements(newElements);
                pushHistory(newElements);
                setEditingNote(null);
              }}
              onKeyDown={(ev) => {
                ev.stopPropagation(); // don't let canvas shortcuts fire
                if (ev.key === "Escape") { ev.target.blur(); return; }
                if ((ev.metaKey || ev.ctrlKey) && ev.key === "Enter") { ev.target.blur(); return; }
                // Plain Enter → new line (default textarea behavior, no intercept needed)
              }}
              className="absolute resize-none text-[11.5px] leading-[15px] border-2 border-amber-400 rounded-md p-2 pt-[22px] bg-yellow-50 dark:bg-yellow-900/20 text-amber-900 dark:text-amber-200 outline-none font-mono"
              style={{
                left: el.x,
                top: el.y,
                width: el.w,
                height: el.h,
                zIndex: 20,
              }} />
          );
        })()}
          </div>{/* end relative 2400×1600 */}
        </div>{/* end overflow-auto scroll container */}
      </div>{/* end flex-1 relative canvas wrapper */}
    </div>
  );
}
