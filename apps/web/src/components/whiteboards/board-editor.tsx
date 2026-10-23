"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CircleIcon,
  MinusIcon,
  MousePointer2Icon,
  PencilIcon,
  PlusIcon,
  Redo2Icon,
  SquareIcon,
  StickyNoteIcon,
  TypeIcon,
  Undo2Icon,
  Trash2Icon,
  HandIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { Button } from "@zentro/ui/shadcn/button";

type Kind = "pen" | "rect" | "ellipse" | "line" | "arrow" | "text" | "sticky";
type El = {
  id: string;
  type: Kind;
  x: number;
  y: number;
  w: number;
  h: number;
  points?: number[];
  color: string;
  text?: string;
};
type Tool = "select" | "hand" | Kind;
type View = { x: number; y: number; k: number };

const palette = ["ink", "#dc2626", "#d97706", "#16a34a", "#2563eb", "#7c3aed"];

const tools: { id: Tool; label: string; icon: typeof PencilIcon }[] = [
  { id: "select", label: "Select", icon: MousePointer2Icon },
  { id: "hand", label: "Pan", icon: HandIcon },
  { id: "pen", label: "Pen", icon: PencilIcon },
  { id: "rect", label: "Rectangle", icon: SquareIcon },
  { id: "ellipse", label: "Ellipse", icon: CircleIcon },
  { id: "line", label: "Line", icon: MinusIcon },
  { id: "arrow", label: "Arrow", icon: ArrowUpRightIcon },
  { id: "text", label: "Text", icon: TypeIcon },
  { id: "sticky", label: "Sticky note", icon: StickyNoteIcon },
];

const newId = () => Math.random().toString(36).slice(2, 12);
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

function bounds(el: El) {
  if (el.type === "pen" || el.type === "line" || el.type === "arrow") {
    const p = el.points ?? [0, 0];
    const xs = p.filter((_, i) => i % 2 === 0);
    const ys = p.filter((_, i) => i % 2 === 1);
    return {
      x: el.x + Math.min(...xs),
      y: el.y + Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    };
  }

  return { x: el.x, y: el.y, w: el.w, h: el.h };
}

function Shape({
  el,
  editing,
  onText,
  onDone,
}: {
  el: El;
  editing: boolean;
  onText: (text: string) => void;
  onDone: () => void;
}) {
  const ink = el.color === "ink" ? "currentColor" : el.color;
  const stroke = { stroke: ink, strokeWidth: 3, fill: "none" } as const;
  const hit = { strokeWidth: 14, stroke: "transparent", fill: "none" } as const;

  if (el.type === "rect")
    return (
      <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={6} {...stroke} />
    );

  if (el.type === "ellipse")
    return (
      <ellipse
        cx={el.x + el.w / 2}
        cy={el.y + el.h / 2}
        rx={el.w / 2}
        ry={el.h / 2}
        {...stroke}
      />
    );

  if (el.type === "pen" || el.type === "line" || el.type === "arrow") {
    const p = el.points ?? [];
    const d = p
      .reduce<string[]>((acc, v, i) => {
        if (i % 2 === 0) acc.push(`${i === 0 ? "M" : "L"}${v}`);
        else acc[acc.length - 1] += ` ${v}`;
        return acc;
      }, [])
      .join(" ");
    let head = "";

    if (el.type === "arrow" && p.length >= 4) {
      const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = p;
      const a = Math.atan2(y2 - y1, x2 - x1);
      const s = 14;
      head = `M${x2 - s * Math.cos(a - 0.45)} ${y2 - s * Math.sin(a - 0.45)} L${x2} ${y2} L${x2 - s * Math.cos(a + 0.45)} ${y2 - s * Math.sin(a + 0.45)}`;
    }

    return (
      <g transform={`translate(${el.x} ${el.y})`}>
        <path d={d} {...hit} />
        <path d={d} {...stroke} strokeLinecap="round" strokeLinejoin="round" />
        {head ? (
          <path
            d={head}
            {...stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </g>
    );
  }

  const sticky = el.type === "sticky";

  return (
    <g>
      {sticky ? (
        <rect
          x={el.x}
          y={el.y}
          width={el.w}
          height={el.h}
          rx={4}
          fill={ink}
          fillOpacity={0.22}
          stroke={ink}
          strokeWidth={1.5}
        />
      ) : (
        <rect x={el.x} y={el.y} width={el.w} height={el.h} fill="transparent" />
      )}
      <foreignObject x={el.x} y={el.y} width={el.w} height={el.h}>
        {editing ? (
          <textarea
            ref={(node) => {
              // The click that made the note would otherwise steal focus.
              if (node) setTimeout(() => node.focus(), 30);
            }}
            defaultValue={el.text ?? ""}
            aria-label="Text"
            onChange={(event) => onText(event.target.value)}
            onBlur={onDone}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Escape") onDone();
            }}
            style={{
              width: "100%",
              height: "100%",
              resize: "none",
              border: 0,
              outline: "none",
              background: "transparent",
              color: sticky ? "currentColor" : ink,
              font: "20px/1.3 system-ui, sans-serif",
              padding: 8,
            }}
          />
        ) : (
          <div
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              color: sticky ? "currentColor" : ink,
              font: "20px/1.3 system-ui, sans-serif",
              padding: 8,
              pointerEvents: "none",
            }}
          >
            {el.text}
          </div>
        )}
      </foreignObject>
    </g>
  );
}

export function BoardEditor({ id }: { id: string }) {
  const trpc = useTrpcClient();
  const svgRef = useRef<SVGSVGElement>(null);
  const [title, setTitle] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "missing">(
    "loading",
  );
  const [elements, setElements] = useState<El[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState(palette[0]!);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [save, setSave] = useState<"saved" | "saving" | "dirty" | "error">(
    "saved",
  );
  const history = useRef<{ past: El[][]; future: El[][] }>({
    past: [],
    future: [],
  });
  const drag = useRef<
    | { kind: "pan"; sx: number; sy: number; vx: number; vy: number }
    | {
        kind: "move";
        id: string;
        sx: number;
        sy: number;
        ox: number;
        oy: number;
        moved: boolean;
      }
    | { kind: "draw"; id: string; sx: number; sy: number }
    | null
  >(null);
  const dirty = useRef(false);
  const latestStart = useRef<El[]>([]);
  const latest = useRef(elements);
  latest.current = elements;

  useEffect(() => {
    let cancelled = false;

    trpc.whiteboard.get
      .query({ id })
      .then((board) => {
        if (cancelled) return;
        setTitle(board.title);
        setCanEdit(board.canEdit);
        setElements(board.elements as El[]);
        setState("ready");
      })
      .catch(() => !cancelled && setState("missing"));

    return () => {
      cancelled = true;
    };
  }, [trpc, id]);

  const flush = useCallback(async () => {
    if (!dirty.current) return;

    dirty.current = false;
    setSave("saving");
    try {
      await trpc.whiteboard.save.mutate({ id, elements: latest.current });
      setSave(dirty.current ? "dirty" : "saved");
    } catch {
      dirty.current = true;
      setSave("error");
    }
  }, [trpc, id]);

  useEffect(() => {
    if (save !== "dirty") return;
    const timer = setTimeout(() => void flush(), 800);
    return () => clearTimeout(timer);
  }, [save, elements, flush]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  /** Applies a change and records it so it can be undone. */
  const commit = useCallback((next: El[], record = true) => {
    if (record) {
      history.current.past = [
        ...history.current.past.slice(-99),
        latest.current,
      ];
      history.current.future = [];
    }
    latest.current = next;
    setElements(next);
    dirty.current = true;
    setSave("dirty");
  }, []);

  const undo = useCallback(() => {
    const prev = history.current.past.pop();
    if (!prev) return;
    history.current.future.push(latest.current);
    commit(prev, false);
    setSelected(null);
  }, [commit]);

  const redo = useCallback(() => {
    const next = history.current.future.pop();
    if (!next) return;
    history.current.past.push(latest.current);
    commit(next, false);
  }, [commit]);

  const removeSelected = useCallback(() => {
    if (!selected) return;
    commit(latest.current.filter((el) => el.id !== selected));
    setSelected(null);
  }, [selected, commit]);

  useEffect(() => {
    if (!canEdit) return;

    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("textarea, input")) return;
      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeSelected();
      } else if (event.key === "Escape") {
        setSelected(null);
        setTool("select");
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canEdit, undo, redo, removeSelected]);

  function world(event: { clientX: number; clientY: number }) {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - view.x) / view.k,
      y: (event.clientY - rect.top - view.y) / view.k,
    };
  }

  function zoom(factor: number, cx?: number, cy?: number) {
    setView((v) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const px = cx ?? rect.width / 2;
      const py = cy ?? rect.height / 2;
      const k = clamp(v.k * factor, 0.1, 4);
      return {
        k,
        x: px - ((px - v.x) / v.k) * k,
        y: py - ((py - v.y) / v.k) * k,
      };
    });
  }

  function onWheel(event: React.WheelEvent) {
    if (event.ctrlKey || event.metaKey) {
      const rect = svgRef.current!.getBoundingClientRect();
      zoom(
        event.deltaY < 0 ? 1.1 : 1 / 1.1,
        event.clientX - rect.left,
        event.clientY - rect.top,
      );
    } else {
      setView((v) => ({ ...v, x: v.x - event.deltaX, y: v.y - event.deltaY }));
    }
  }

  function onDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (editing) return;
    svgRef.current!.setPointerCapture(event.pointerId);
    const p = world(event);
    const panning = tool === "hand" || event.button === 1;

    if (panning || (!canEdit && tool !== "select")) {
      drag.current = {
        kind: "pan",
        sx: event.clientX,
        sy: event.clientY,
        vx: view.x,
        vy: view.y,
      };
      return;
    }

    if (tool === "select") {
      const hitId = (event.target as Element)
        .closest("[data-el]")
        ?.getAttribute("data-el");
      setSelected(hitId ?? null);

      const el = elements.find((item) => item.id === hitId);
      if (el && canEdit)
        drag.current = {
          kind: "move",
          id: el.id,
          sx: p.x,
          sy: p.y,
          ox: el.x,
          oy: el.y,
          moved: false,
        };
      else
        drag.current = {
          kind: "pan",
          sx: event.clientX,
          sy: event.clientY,
          vx: view.x,
          vy: view.y,
        };
      return;
    }

    const base = { id: newId(), color, x: p.x, y: p.y, w: 0, h: 0 };

    if (tool === "text" || tool === "sticky") {
      const el: El =
        tool === "sticky"
          ? {
              ...base,
              type: "sticky",
              x: p.x - 80,
              y: p.y - 60,
              w: 160,
              h: 120,
              text: "",
            }
          : { ...base, type: "text", w: 220, h: 40, text: "" };
      commit([...elements, el]);
      setSelected(el.id);
      setEditing(el.id);
      setTool("select");
      return;
    }

    const el: El = {
      ...base,
      type: tool,
      points:
        tool === "pen"
          ? [0, 0]
          : tool === "line" || tool === "arrow"
            ? [0, 0, 0, 0]
            : undefined,
    };
    history.current.past = [...history.current.past.slice(-99), elements];
    history.current.future = [];
    latest.current = [...elements, el];
    setElements(latest.current);
    drag.current = { kind: "draw", id: el.id, sx: p.x, sy: p.y };
  }

  function onMove(event: ReactPointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d) return;

    if (d.kind === "pan") {
      setView((v) => ({
        ...v,
        x: d.vx + event.clientX - d.sx,
        y: d.vy + event.clientY - d.sy,
      }));
      return;
    }

    const p = world(event);

    if (d.kind === "move") {
      const dx = p.x - d.sx;
      const dy = p.y - d.sy;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) <= 2) return;
      if (!d.moved) latestStart.current = latest.current;
      d.moved = true;
      const moved = latest.current.map((el) =>
        el.id === d.id ? { ...el, x: d.ox + dx, y: d.oy + dy } : el,
      );
      latest.current = moved;
      setElements(moved);
      return;
    }

    const drawn = latest.current.map((el) => {
      if (el.id !== d.id) return el;
      if (el.type === "pen")
        return {
          ...el,
          points: [...(el.points ?? []), p.x - el.x, p.y - el.y],
        };
      if (el.type === "line" || el.type === "arrow")
        return { ...el, points: [0, 0, p.x - d.sx, p.y - d.sy] };
      return {
        ...el,
        x: Math.min(d.sx, p.x),
        y: Math.min(d.sy, p.y),
        w: Math.abs(p.x - d.sx),
        h: Math.abs(p.y - d.sy),
      };
    });
    latest.current = drawn;
    setElements(drawn);
  }

  function onUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;

    if (d.kind === "move") {
      if (d.moved) {
        history.current.past = [
          ...history.current.past.slice(-99),
          latestStart.current,
        ];
        history.current.future = [];
        dirty.current = true;
        setSave("dirty");
      }
      return;
    }

    if (d.kind === "draw") {
      const el = latest.current.find((item) => item.id === d.id);
      const tiny =
        !el ||
        ((el.type === "rect" || el.type === "ellipse") &&
          el.w < 4 &&
          el.h < 4) ||
        ((el.type === "line" || el.type === "arrow") &&
          Math.hypot(el.points?.[2] ?? 0, el.points?.[3] ?? 0) < 4);

      if (tiny) {
        latest.current = latest.current.filter((item) => item.id !== d.id);
        setElements(latest.current);
        history.current.past.pop();
        return;
      }

      dirty.current = true;
      setSave("dirty");
      setSelected(d.id);
    }
  }

  // `setElements` inside move handlers keeps `latest` in sync on the next render.
  const sel = elements.find((el) => el.id === selected);
  const box = sel ? bounds(sel) : null;
  const cursor =
    tool === "hand" ? "grab" : tool === "select" ? "default" : "crosshair";

  if (state === "loading")
    return (
      <p role="status" className="p-6 text-sm text-ink-2">
        Loading board…
      </p>
    );

  if (state === "missing")
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-ink">This board could not be opened.</p>
        <Button asChild variant="outline">
          <Link href="/whiteboards">Back to boards</Link>
        </Button>
      </div>
    );

  return (
    <div className="relative -mx-4 -mt-5 -mb-12 flex h-[calc(100svh-3.5rem)] min-h-[480px] flex-col overflow-hidden border-t border-hairline md:-mx-(--gutter) md:-mt-7 md:-mb-16">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/whiteboards" aria-label="Back to boards">
            <ArrowLeftIcon aria-hidden />
          </Link>
        </Button>
        <h1 className="truncate text-sm font-semibold">{title}</h1>
        <span role="status" className="text-xs text-ink-3">
          {!canEdit
            ? "View only"
            : save === "saving"
              ? "Saving…"
              : save === "dirty"
                ? "Unsaved changes"
                : save === "error"
                  ? "Could not save — retrying on next change"
                  : "Saved"}
        </span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-sunken/40">
        {canEdit ? (
          <div
            role="toolbar"
            aria-label="Drawing tools"
            className="absolute top-3 left-1/2 z-10 flex max-w-[calc(100%-1rem)] -translate-x-1/2 flex-wrap items-center gap-1 rounded-xl border border-line bg-canvas p-1 shadow-sm"
          >
            {tools.map(({ id: toolId, label, icon: Icon }) => (
              <Button
                key={toolId}
                size="icon-sm"
                variant={tool === toolId ? "secondary" : "ghost"}
                aria-label={label}
                aria-pressed={tool === toolId}
                title={label}
                onClick={() => setTool(toolId)}
              >
                <Icon aria-hidden />
              </Button>
            ))}
            <span className="mx-1 h-5 w-px bg-line" />
            {palette.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                onClick={() => {
                  setColor(c);
                  if (sel)
                    commit(
                      elements.map((el) =>
                        el.id === sel.id ? { ...el, color: c } : el,
                      ),
                    );
                }}
                style={{ background: c === "ink" ? "currentColor" : c }}
                className={`size-5 rounded-full ${color === c ? "ring-2 ring-ink ring-offset-2" : ""}`}
              />
            ))}
            <span className="mx-1 h-5 w-px bg-line" />
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Undo"
              onClick={undo}
            >
              <Undo2Icon aria-hidden />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Redo"
              onClick={redo}
            >
              <Redo2Icon aria-hidden />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Delete selected"
              disabled={!selected}
              onClick={removeSelected}
            >
              <Trash2Icon aria-hidden />
            </Button>
          </div>
        ) : null}

        <svg
          ref={svgRef}
          role="img"
          aria-label="Whiteboard canvas"
          className="size-full touch-none text-ink select-none"
          style={{
            cursor,
            backgroundImage:
              "radial-gradient(var(--color-line, #d4d4d8) 1px, transparent 1px)",
            backgroundSize: `${24 * view.k}px ${24 * view.k}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onWheel={onWheel}
          onDoubleClick={(event) => {
            const hitId = (event.target as Element)
              .closest("[data-el]")
              ?.getAttribute("data-el");
            const el = elements.find((item) => item.id === hitId);
            if (canEdit && el && (el.type === "text" || el.type === "sticky"))
              setEditing(el.id);
          }}
        >
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            {elements.map((el) => (
              <g
                key={el.id}
                data-el={el.id}
                style={{ pointerEvents: tool === "select" ? "all" : "none" }}
              >
                <Shape
                  el={el}
                  editing={editing === el.id}
                  onText={(text) =>
                    setElements((list) => {
                      const next = list.map((item) =>
                        item.id === el.id ? { ...item, text } : item,
                      );
                      latest.current = next;
                      dirty.current = true;
                      return next;
                    })
                  }
                  onDone={() => {
                    setEditing(null);
                    const current = latest.current.find(
                      (item) => item.id === el.id,
                    );
                    if (current && !current.text?.trim()) {
                      latest.current = latest.current.filter(
                        (item) => item.id !== el.id,
                      );
                      setElements(latest.current);
                    }
                    dirty.current = true;
                    setSave("dirty");
                  }}
                />
              </g>
            ))}
            {box ? (
              <rect
                x={box.x - 6}
                y={box.y - 6}
                width={box.w + 12}
                height={box.h + 12}
                fill="none"
                stroke="#2563eb"
                strokeDasharray="5 4"
                pointerEvents="none"
              />
            ) : null}
          </g>
        </svg>

        {elements.length === 0 ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-ink-3">
            {canEdit
              ? "Pick a tool and start drawing."
              : "This board is empty."}
          </p>
        ) : null}

        <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-xl border border-line bg-canvas p-1 shadow-sm">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Zoom out"
            onClick={() => zoom(1 / 1.2)}
          >
            <MinusIcon aria-hidden />
          </Button>
          <button
            type="button"
            className="w-12 text-center text-xs tabular-nums"
            aria-label="Reset zoom"
            onClick={() => setView({ x: 0, y: 0, k: 1 })}
          >
            {Math.round(view.k * 100)}%
          </button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Zoom in"
            onClick={() => zoom(1.2)}
          >
            <PlusIcon aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
