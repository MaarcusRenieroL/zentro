"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { paths } from "~/src/lib/paths";

import {
  ATTACHMENTS,
  AUDIT,
  CHIPS,
  FOOT_LIVE,
  FOOT_SOON,
  GROUPS,
  HORIZONTAL,
  KEYS,
  LD,
  LM,
  MATRIX,
  PREVIEWS,
  PULSE,
  type ThreadKey,
} from "./landing-data";

const DISPLAY = "var(--font-bricolage), var(--font-geist), sans-serif";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";
const SERIF = "var(--font-instrument-serif), Georgia, serif";
const storageKey = "zentro-landing-theme";

type Mode = "dark" | "light" | "system";

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const dashed = (dir: "h" | "v"): CSSProperties => ({
  backgroundImage: `repeating-linear-gradient(${dir === "h" ? "to right" : "to bottom"}, var(--track) 0 4px, transparent 4px 10px)`,
});

const solidLine: CSSProperties = {
  background: "var(--accent)",
  boxShadow: "var(--glow)",
};

const nodeStyle = (on: boolean): CSSProperties => ({
  display: "block",
  width: 9,
  height: 9,
  borderRadius: 999,
  boxSizing: "border-box",
  background: on ? "var(--accent)" : "var(--bg)",
  border: on ? "none" : "1.5px solid var(--track)",
  boxShadow: on
    ? "0 0 0 4px color-mix(in oklab, var(--accent) 20%, transparent), var(--glow)"
    : "none",
  transition: "all .3s",
});

const label: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  color: "var(--ink3)",
};

const stateChip = (color: string): CSSProperties => ({
  fontFamily: MONO,
  fontSize: 11,
  padding: "3px 9px",
  borderRadius: 999,
  color,
  background: `color-mix(in oklab, ${color} 15%, transparent)`,
});

const accentWord: CSSProperties = {
  fontFamily: SERIF,
  fontStyle: "italic",
  fontWeight: 400,
  fontSize: "1.1em",
  letterSpacing: "-0.01em",
};

const primaryPill = (h: number, px: number, size: number): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  height: h,
  padding: `0 ${px}px`,
  borderRadius: 999,
  background: "var(--btn)",
  color: "var(--btn-ink)",
  fontSize: size,
  fontWeight: 500,
  textDecoration: "none",
});

const ghostPill = (h: number, px: number, size: number): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  height: h,
  padding: `0 ${px}px`,
  borderRadius: 999,
  border: "1px solid var(--line)",
  color: "var(--ink)",
  fontSize: size,
  fontWeight: 500,
  textDecoration: "none",
});

const logoMark = (size: number, radius: number, bar: number): ReactNode => (
  <span
    aria-hidden="true"
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: "var(--ink)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <span
      style={{
        width: 2,
        height: bar,
        borderRadius: 2,
        background: "var(--accent)",
      }}
    />
  </span>
);

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        height: 28,
        padding: "0 12px",
        borderRadius: 99,
        border: "none",
        cursor: "pointer",
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: ".04em",
        textTransform: "uppercase",
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--bg)" : "var(--ink2)",
      }}
    >
      {children}
    </button>
  );
}

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("dark");
  const [sysLight, setSysLight] = useState(false);
  const [P, setP] = useState(0);
  const [vw, setVw] = useState(1440);
  const [reduced, setReduced] = useState(false);
  const [projOff, setProjOff] = useState(true);
  const [tick, setTick] = useState(0);
  const [ringIn, setRingIn] = useState(false);
  const [pulseAt, setPulseAt] = useState(0);

  // Theme: remembered, and "system" follows the OS.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);

      if (saved === "light" || saved === "dark" || saved === "system") {
        setMode(saved);
      }
    } catch {
      // Storage can be blocked; dark is the default.
    }

    const query = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => setSysLight(query.matches);

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  // The product window is alive: the timer runs, the ring fills once, the
  // team pulse walks down its rows. All of it stops under reduced motion.
  useEffect(() => {
    if (reduced) return;

    setRingIn(true);

    const clock = setInterval(() => setTick((value) => value + 1), 1000);
    const walk = setInterval(
      () => setPulseAt((value) => (value + 1) % 4),
      2200,
    );

    return () => {
      clearInterval(clock);
      clearInterval(walk);
    };
  }, [reduced]);

  const chooseMode = (next: Mode) => {
    setMode(next);

    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Not remembered, still switched.
    }
  };

  // The Thread: one progress value from scroll; fully drawn under reduced motion.
  const measure = useCallback(() => {
    const root = rootRef.current;

    if (!root) return;

    const box = root.getBoundingClientRect();
    const inner = window.innerHeight;

    setP(
      clamp((inner * 0.6 - box.top) / Math.max(1, box.height - inner * 0.4)),
    );
    setVw(root.offsetWidth);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    setReduced(query.matches);
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const theme = mode === "system" ? (sysLight ? "light" : "dark") : mode;
  const m = vw < 1100;
  const progress = reduced ? 1 : P;
  const trans = reduced ? "none" : undefined;

  const f = useMemo(() => {
    const out = {} as Record<ThreadKey, number>;

    KEYS.forEach((key, i) => {
      out[key] = clamp(progress * KEYS.length - i);
    });

    return out;
  }, [progress]);

  const fill = (key: ThreadKey): CSSProperties => {
    const h = HORIZONTAL[key];

    return {
      position: "absolute",
      inset: 0,
      background: "var(--accent)",
      boxShadow: "var(--glow)",
      transformOrigin: h ?? "top",
      transform: h ? `scaleX(${f[key]})` : `scaleY(${f[key]})`,
      transition: trans ?? "transform .25s linear",
    };
  };
  const node = (key: ThreadKey) => nodeStyle(f[key] > 0.001);

  // Section 2: the tool chips string onto the Thread.
  const sc = m ? 0.78 : 1;
  const W = m ? 326 : 440;
  const LY = m ? 140 : 200;
  const chipH = 34 * sc;
  const gap = 6 * sc;
  const merged: Array<[number, number]> = [];

  [
    [0, 5],
    [5, 10],
  ].forEach(([a, b], row) => {
    const widths = CHIPS.slice(a!, b).map((c) => c[1] * sc);
    let x =
      W - (widths.reduce((sum, w) => sum + w, 0) + gap * 4) - (m ? 4 : 36);

    widths.forEach((w) => {
      merged.push([x, row ? LY + 2 : LY - chipH - 2]);
      x += w + gap;
    });
  });

  const ce = ease(f.s2b);
  const rootVars = { ...(m ? LM : LD) } as CSSProperties;

  // Section 3: attachments snap on as the line reaches them.
  let attached = 0;
  const attOn = ATTACHMENTS.map((_, i) => {
    const on = f.s3a >= (i + 1) / 6;

    if (on) attached += 1;

    return on;
  });

  const endOn = f.s6c >= 0.999;
  const auditProgress = m ? f.s5 : f.s5x;
  const mx = 2;
  const base = 1 * 3600 + 24 * 60 + 36 + tick;
  const timer = [
    Math.floor(base / 3600),
    Math.floor((base % 3600) / 60),
    base % 60,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  const ringPct = reduced || ringIn ? 62.5 : 0;
  const rise = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

  return (
    <div
      ref={rootRef}
      className={theme === "light" ? "landing-light" : "landing-dark"}
      style={{
        ...rootVars,
        position: "relative",
        overflowX: "clip",
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--font-geist), system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
        minHeight: "100vh",
      }}
    >
      {/* Sticky nav */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "0 var(--pr) 0 var(--navPL)",
          background: "var(--nav-bg)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--line2)",
        }}
      >
        <a
          href="#top"
          aria-label="Zentro home"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "var(--ink)",
            textDecoration: "none",
          }}
        >
          {logoMark(22, 7, 12)}
          <span
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: "-0.04em",
            }}
          >
            Zentro
          </span>
        </a>
        {!m ? (
          <nav
            aria-label="Primary"
            style={{ display: "flex", gap: 28, marginLeft: 24 }}
          >
            {[
              ["Product", "#product"],
              ["Modules", "#modules"],
              ["Control", "#control"],
            ].map(([name, href]) => (
              <a
                key={href}
                href={href}
                style={{
                  color: "var(--ink2)",
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                {name}
              </a>
            ))}
          </nav>
        ) : null}
        <div className="l-rise" style={{ flex: 1 }} />
        {!m ? (
          <>
            <div
              role="group"
              aria-label="Theme"
              style={{
                display: "flex",
                gap: 2,
                padding: 3,
                border: "1px solid var(--line)",
                borderRadius: 999,
              }}
            >
              <Segment
                active={mode === "light"}
                onClick={() => chooseMode("light")}
              >
                Light
              </Segment>
              <Segment
                active={mode === "dark"}
                onClick={() => chooseMode("dark")}
              >
                Dark
              </Segment>
            </div>
            <Link
              href={paths.auth.signIn()}
              style={{
                color: "var(--ink)",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </>
        ) : null}
        <Link
          href={paths.auth.signUp()}
          className="l-btn"
          style={primaryPill(38, 18, 14)}
        >
          Start free
        </Link>
        {m ? (
          <button
            type="button"
            aria-label="Switch theme"
            onClick={() => chooseMode(theme === "dark" ? "light" : "dark")}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: "1px solid var(--line)",
              background: "transparent",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              cursor: "pointer",
            }}
          >
            <span
              style={{ width: 14, height: 1.5, background: "var(--ink)" }}
            />
            <span
              style={{ width: 14, height: 1.5, background: "var(--ink)" }}
            />
          </button>
        ) : null}
      </header>

      <main>
        {/* 1. Hero */}
        <section
          id="top"
          style={{
            position: "relative",
            padding: "120px var(--pr) 0 var(--px)",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            className="l-drift"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "36%",
              width: 180,
              background:
                "linear-gradient(to bottom, transparent, var(--beam) 40%, transparent)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            className="l-drift"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "61%",
              width: 120,
              background:
                "linear-gradient(to bottom, transparent, var(--beam) 55%, transparent)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "83%",
              width: 220,
              background:
                "linear-gradient(to bottom, var(--beam), transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -240,
              left: "30%",
              width: 1100,
              height: 900,
              background:
                "radial-gradient(closest-side, var(--wash), transparent)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "calc(var(--tx) - 0.75px)",
              top: 150,
              bottom: 0,
              width: 1.5,
              ...dashed("v"),
            }}
          >
            <div style={fill("hero")} />
          </div>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "calc(var(--tx) - 4.5px)",
              top: 146,
            }}
          >
            <div className="l-ping" style={node("hero")} />
          </div>

          <h1
            className="l-rise"
            style={{
              position: "relative",
              margin: 0,
              maxWidth: 1080,
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: "var(--h1)",
              lineHeight: 0.98,
              letterSpacing: "-0.04em",
              textWrap: "balance",
            }}
          >
            One workspace for <em style={accentWord}>everything</em> your
            company runs on.
          </h1>

          <div
            style={{
              position: "relative",
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--heroGap)",
              marginTop: 56,
              alignItems: "flex-start",
              ...rise(180),
            }}
          >
            <div
              style={{
                flex: "1 1 300px",
                maxWidth: 400,
                display: "flex",
                flexDirection: "column",
                gap: 28,
                paddingTop: 6,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--lead)",
                  lineHeight: 1.5,
                  color: "var(--ink2)",
                  textWrap: "pretty",
                }}
              >
                Zentro puts your projects, tasks, docs and team under one
                permission system and one search, and you switch on only the
                modules you use.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link
                  href={paths.auth.signUp()}
                  className="l-btn"
                  style={primaryPill(48, 24, 15)}
                >
                  Start free
                </Link>
                <a
                  href="#modules"
                  className="l-btn"
                  style={ghostPill(48, 22, 15)}
                >
                  See the modules
                </a>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  paddingTop: 20,
                  borderTop: "1px solid var(--line2)",
                }}
              >
                <span style={label}>Live today</span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "var(--ink2)",
                  }}
                >
                  Projects · Tasks · Teams · Docs · Roles · Audit log · Modules
                </span>
              </div>
            </div>

            {/* Product window: the Today screen */}
            <div
              style={{
                flex: "none",
                width: "var(--shotW)",
                maxWidth: "100%",
                position: "relative",
                marginBottom: -90,
              }}
            >
              <div
                aria-hidden="true"
                className="l-breathe"
                style={{
                  position: "absolute",
                  left: "-10%",
                  right: "-10%",
                  bottom: -120,
                  height: 640,
                  background:
                    "radial-gradient(closest-side, var(--halo), transparent)",
                  pointerEvents: "none",
                }}
              />
              <div
                role="img"
                aria-label="The Today screen: a running task, what is next, the day ring and the team pulse"
                style={{
                  position: "relative",
                  borderRadius: 28,
                  border: "1px solid var(--line)",
                  background: "var(--frame)",
                  boxShadow: "var(--shadow)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 18px",
                    borderBottom: "1px solid var(--line2)",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 99,
                        background: "var(--line)",
                      }}
                    />
                  ))}
                  <span
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontFamily: MONO,
                      fontSize: 12,
                      color: "var(--ink3)",
                    }}
                  >
                    fernway.zentro.app / today
                  </span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      color: "var(--ink3)",
                      border: "1px solid var(--line)",
                      borderRadius: 6,
                      padding: "2px 6px",
                    }}
                  >
                    ⌘K
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "var(--shotCols)",
                    minHeight: 620,
                  }}
                >
                  <div
                    style={{
                      display: "var(--sbD)" as CSSProperties["display"],
                      borderRight: "1px solid var(--line2)",
                      padding: "18px 12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "0 8px 18px",
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 7,
                          background: "var(--peach)",
                          border: "1px solid var(--line)",
                          fontFamily: MONO,
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        F
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        Fernway
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        fontSize: 14,
                      }}
                    >
                      {[
                        ["Today", true, ""],
                        ["Projects", false, ""],
                        ["Tasks", false, "8"],
                        ["Docs", false, ""],
                        ["Teams", false, ""],
                      ].map(([name, active, count]) => (
                        <div
                          key={String(name)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            height: 34,
                            padding: "0 10px",
                            borderRadius: 10,
                            background: active ? "var(--tile2)" : "transparent",
                            color: active ? "var(--ink)" : "var(--ink2)",
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 3,
                              background: active ? "var(--ink)" : "transparent",
                              border: active ? "none" : "1px solid var(--ink3)",
                            }}
                          />
                          {name}
                          {count ? (
                            <span
                              style={{
                                marginLeft: "auto",
                                fontFamily: MONO,
                                fontSize: 11,
                                color: "var(--ink3)",
                              }}
                            >
                              {count}
                            </span>
                          ) : null}
                        </div>
                      ))}
                      <div
                        style={{
                          ...label,
                          fontSize: 10,
                          padding: "18px 10px 6px",
                        }}
                      >
                        Coming
                      </div>
                      {["Chat", "Calendar"].map((name) => (
                        <div
                          key={name}
                          data-dim=""
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            height: 34,
                            padding: "0 10px",
                            color: "var(--ink3)",
                            opacity: 0.6,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 3,
                              border: "1px dashed var(--ink3)",
                            }}
                          />
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "26px 28px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 20,
                      minWidth: 0,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: MONO,
                          fontSize: 12,
                          color: "var(--ink3)",
                        }}
                      >
                        Wed · Oct 14
                      </div>
                      <div
                        style={{
                          fontFamily: DISPLAY,
                          fontWeight: 700,
                          fontSize: 28,
                          letterSpacing: "-0.03em",
                          marginTop: 4,
                        }}
                      >
                        Good morning, Mira
                      </div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0,1.35fr) minmax(0,1fr)",
                        gap: 16,
                        alignItems: "start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 16,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            border: "1px solid var(--line)",
                            borderRadius: 18,
                            background: "var(--tile)",
                            padding: 22,
                            display: "flex",
                            flexDirection: "column",
                            gap: 18,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span style={label}>Focus</span>
                            <span style={stateChip("var(--amber)")}>
                              In progress
                            </span>
                          </div>
                          <div>
                            <div
                              style={{
                                fontFamily: MONO,
                                fontSize: 12,
                                color: "var(--ink3)",
                              }}
                            >
                              ZEN-142 · Onboarding v2
                            </div>
                            <div
                              style={{
                                fontSize: 21,
                                fontWeight: 600,
                                letterSpacing: "-0.01em",
                                marginTop: 6,
                              }}
                            >
                              Ship onboarding checklist v2
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-end",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontFamily: MONO,
                                  fontSize: 44,
                                  letterSpacing: "-0.03em",
                                  lineHeight: 1,
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {timer}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  marginTop: 8,
                                  fontFamily: MONO,
                                  fontSize: 11,
                                  color: "var(--amber)",
                                }}
                              >
                                <span
                                  data-dim=""
                                  className="l-blink"
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 99,
                                    background: "var(--amber)",
                                  }}
                                />
                                Running since 08:51
                              </div>
                            </div>
                            <span
                              style={{
                                height: 34,
                                padding: "0 14px",
                                borderRadius: 999,
                                border: "1px solid var(--line)",
                                fontSize: 13,
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              Pause
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: 4,
                                borderRadius: 99,
                                background: "var(--line2)",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: "66%",
                                  height: "100%",
                                  background: "var(--ink2)",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontFamily: MONO,
                                fontSize: 11,
                                color: "var(--ink3)",
                              }}
                            >
                              4/6 subtasks
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            border: "1px solid var(--line)",
                            borderRadius: 18,
                            background: "var(--tile)",
                            padding: "8px 8px 6px",
                          }}
                        >
                          <div style={{ ...label, padding: "10px 12px 8px" }}>
                            Up next
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "10px 12px",
                              borderRadius: 12,
                              background: "var(--tile2)",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: MONO,
                                fontSize: 12,
                                color: "var(--ink3)",
                              }}
                            >
                              ZEN-145
                            </span>
                            <span
                              style={{
                                flex: 1,
                                minWidth: 0,
                                fontSize: 13,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              Release notes for Docs permissions
                            </span>
                            <span
                              style={{
                                height: 28,
                                padding: "0 14px",
                                borderRadius: 999,
                                background: "var(--btn)",
                                color: "var(--btn-ink)",
                                fontSize: 12,
                                fontWeight: 500,
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              Start
                            </span>
                          </div>
                          {[
                            [
                              "ZEN-139",
                              "Review Teams invite flow",
                              "In review",
                              "var(--cyan)",
                            ],
                            [
                              "ZEN-127",
                              "Audit log CSV export",
                              "Overdue",
                              "var(--rose)",
                            ],
                          ].map(([key, title, state, color]) => (
                            <div
                              key={key}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "10px 12px",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: MONO,
                                  fontSize: 12,
                                  color: "var(--ink3)",
                                }}
                              >
                                {key}
                              </span>
                              <span
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  fontSize: 13,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {title}
                              </span>
                              <span style={stateChip(color!)}>{state}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 16,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            border: "1px solid var(--line)",
                            borderRadius: 18,
                            background: "var(--tile)",
                            padding: 20,
                            display: "flex",
                            alignItems: "center",
                            gap: 18,
                          }}
                        >
                          <div
                            style={{
                              flex: "none",
                              width: 104,
                              height: 104,
                              borderRadius: "50%",
                              background: `conic-gradient(var(--green) 0 ${ringPct}%, var(--line) ${ringPct}% 100%)`,
                              transition: reduced
                                ? "none"
                                : "background 1.4s cubic-bezier(.2,.7,.2,1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                width: 84,
                                height: 84,
                                borderRadius: "50%",
                                background: "var(--tile)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: DISPLAY,
                                  fontWeight: 700,
                                  fontSize: 26,
                                  letterSpacing: "-0.03em",
                                }}
                              >
                                5/8
                              </span>
                              <span
                                style={{
                                  fontFamily: MONO,
                                  fontSize: 10,
                                  color: "var(--ink3)",
                                }}
                              >
                                DONE
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 7,
                              fontFamily: MONO,
                              fontSize: 12,
                              color: "var(--ink2)",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-geist), sans-serif",
                                fontSize: 15,
                                fontWeight: 600,
                                color: "var(--ink)",
                              }}
                            >
                              Your day
                            </span>
                            <span>3h 10m tracked</span>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 99,
                                  background: "var(--amber)",
                                }}
                              />
                              2 in progress
                            </span>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 99,
                                  background: "var(--rose)",
                                }}
                              />
                              1 overdue
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            border: "1px solid var(--line)",
                            borderRadius: 18,
                            background: "var(--tile)",
                            padding: "18px 18px 8px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              paddingBottom: 10,
                            }}
                          >
                            <span style={{ fontSize: 15, fontWeight: 600 }}>
                              Team pulse
                            </span>
                            <span
                              style={{
                                fontFamily: MONO,
                                fontSize: 11,
                                color: "var(--ink3)",
                              }}
                            >
                              Onboarding v2
                            </span>
                          </div>
                          {PULSE.map(([initials, name, task, dot, bg], pi) => (
                            <div
                              key={name}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "9px 6px",
                                margin: "0 -6px",
                                borderRadius: 8,
                                background:
                                  !reduced && pulseAt === pi
                                    ? "var(--tile2)"
                                    : "transparent",
                                transition: "background .5s",
                                borderTop: "1px solid var(--line2)",
                              }}
                            >
                              <span
                                style={{
                                  flex: "none",
                                  width: 30,
                                  height: 30,
                                  borderRadius: 99,
                                  background: bg,
                                  border: "1px solid var(--line)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontFamily: MONO,
                                  fontSize: 10,
                                  color: "var(--ink)",
                                }}
                              >
                                {initials}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>
                                  {name}
                                </div>
                                <div
                                  style={{
                                    fontFamily: MONO,
                                    fontSize: 11,
                                    color: "var(--ink3)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {task}
                                </div>
                              </div>
                              <span
                                className={
                                  !reduced && pulseAt === pi
                                    ? "l-blink"
                                    : undefined
                                }
                                style={{
                                  flex: "none",
                                  width: 8,
                                  height: 8,
                                  borderRadius: 99,
                                  background: dot,
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. The pile becomes one */}
        <section
          id="product"
          style={{
            position: "relative",
            height: "var(--s2H)",
            paddingBottom: "var(--s2PB)",
            background: "var(--band)",
            borderTop: "1px solid var(--line2)",
            borderBottom: "1px solid var(--line2)",
            overflow: "hidden",
            scrollMarginTop: 64,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "calc(var(--tx) - 0.75px)",
              top: 0,
              height: "var(--lineY)",
              width: 1.5,
              ...dashed("v"),
            }}
          >
            <div style={fill("s2a")} />
          </div>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "var(--tx)",
              top: "var(--lineY)",
              width: "var(--s2bW)",
              height: 1.5,
              ...dashed("h"),
            }}
          >
            <div style={fill("s2b")} />
          </div>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "calc(var(--s2cX) - 0.75px)",
              top: "var(--s2cT)",
              bottom: 0,
              width: 1.5,
              ...dashed("v"),
            }}
          >
            <div style={fill("s2c")} />
          </div>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "calc(var(--tx) - 4.5px)",
              top: "calc(var(--lineY) - 3.75px)",
            }}
          >
            <div style={node("s2b")} />
          </div>

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "var(--chL)",
              top: "var(--chT)",
              width: "var(--chW)",
              height: "var(--chH)",
            }}
          >
            {CHIPS.map(([name, width, sx0, sy0, rot], i) => {
              const sx = m ? sx0 * 0.66 : sx0;
              const sy = m ? sy0 * 0.62 : sy0;
              const x = sx + (merged[i]![0] - sx) * ce;
              const y = sy + (merged[i]![1] - sy) * ce;

              return (
                <div
                  key={name}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width,
                    transformOrigin: "0 0",
                    transform: `translate(${x}px,${y}px) rotate(${rot * (1 - ce)}deg) scale(${sc})`,
                    transition:
                      trans ?? "transform .5s cubic-bezier(.2,.7,.2,1)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 34,
                      borderRadius: 999,
                      border: "1px solid var(--line)",
                      background: "var(--tile)",
                      boxShadow: "var(--shadow)",
                      fontFamily: MONO,
                      fontSize: 13,
                      color: "var(--ink2)",
                    }}
                  >
                    {name}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "var(--tlPos)" as CSSProperties["position"],
              left: "var(--tlL)",
              top: "var(--tlT)",
              width: "var(--tlW)",
              height: "var(--tlH)",
              margin: "var(--tlM)",
              zIndex: 2,
            }}
          >
            <div
              style={{
                height: "100%",
                opacity: 0.45 + 0.55 * ce,
                transform: `scale(${0.97 + 0.03 * ce})`,
                transition: trans ?? "all .5s",
              }}
            >
              <div
                style={{
                  height: "100%",
                  backgroundColor: "var(--tile)",
                  backgroundImage: "var(--glass)",
                  border: "1px solid var(--line)",
                  borderRadius: 28,
                  boxShadow: "var(--shadow)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {logoMark(26, 8, 14)}
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Fernway</span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: MONO,
                      fontSize: 11,
                      color: "var(--ink3)",
                    }}
                  >
                    1 workspace
                  </span>
                </div>
                <div
                  style={{
                    height: 36,
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    background: "var(--tile2)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    fontSize: 13,
                    color: "var(--ink3)",
                  }}
                >
                  Search everything
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: MONO,
                      fontSize: 11,
                    }}
                  >
                    ⌘K
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "7px 12px",
                    fontSize: 13,
                  }}
                >
                  {[
                    ["Projects", "Files"],
                    ["Tasks", "Chat"],
                    ["Docs", "Mail"],
                    ["Teams", "Calendar"],
                    ["Roles", "HR, Payroll"],
                    ["Audit log", "Tickets, Forms"],
                  ].flatMap(([live, soon]) => [
                    <span
                      key={live}
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 99,
                          background: "var(--green)",
                        }}
                      />
                      {live}
                    </span>,
                    <span
                      key={soon}
                      data-dim=""
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        color: "var(--ink3)",
                        opacity: 0.6,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 99,
                          border: "1px solid var(--ink3)",
                        }}
                      />
                      {soon}
                    </span>,
                  ])}
                </div>
                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: 12,
                    borderTop: "1px solid var(--line2)",
                    fontFamily: MONO,
                    fontSize: 11,
                    color: "var(--ink3)",
                  }}
                >
                  1 org · 1 permission system · 1 search · 1 log
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: "var(--txPos)" as CSSProperties["position"],
              left: "var(--txL)",
              right: "var(--txR)",
              top: "var(--txT)",
              transform: "var(--txTr)",
              margin: "var(--txM)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: "var(--h2)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                textWrap: "balance",
              }}
            >
              Ten tools become one <em style={accentWord}>workspace</em>.
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 16,
                lineHeight: 1.55,
                color: "var(--ink2)",
                textWrap: "pretty",
              }}
            >
              Your tracker, wiki, drive, chat, mail, calendar, HR, payroll,
              support desk and forms become modules that share one organization,
              one search and one activity log.
            </p>
            <span
              style={{ fontFamily: MONO, fontSize: 12, color: "var(--ink3)" }}
            >
              Tracker and wiki are live today. The rest is coming.
            </span>
          </div>
        </section>

        {/* 3. One task, everything attached */}
        <section style={{ position: "relative" }}>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "calc(var(--s3x) - 0.75px)",
              top: 0,
              bottom: 0,
              width: 1.5,
              ...dashed("v"),
            }}
          >
            <div style={fill("s3a")} />
          </div>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "var(--tx)",
              bottom: 0,
              width: "calc(var(--s3x) - var(--tx))",
              height: 1.5,
              ...dashed("h"),
            }}
          >
            <div style={fill("s3b")} />
          </div>
          <div
            style={{
              position: "relative",
              padding: "var(--sec) var(--pr) 0 var(--px)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              maxWidth: "var(--s3HW)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: "var(--h2)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                textWrap: "balance",
              }}
            >
              One task, everything <em style={accentWord}>attached</em>.
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--ink2)",
                textWrap: "pretty",
              }}
            >
              A Zentro task knows the doc it was written from, its files, the
              message that changed it, the meeting where it was decided and the
              ticket behind it.
            </p>
          </div>
          <div
            style={{
              position: "relative",
              zIndex: 2,
              width: "var(--taskW)",
              margin: "72px var(--taskMR) 0 var(--taskML)",
              backgroundColor: "var(--tile)",
              backgroundImage: "var(--glass)",
              border: "1px solid var(--line)",
              borderRadius: 20,
              boxShadow: "var(--shadow)",
              overflow: "hidden",
            }}
          >
            <div style={{ height: 10, background: "var(--sky)" }} />
            <div
              style={{
                padding: "22px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 13,
                    color: "var(--ink2)",
                  }}
                >
                  ZEN-142
                </span>
                <span style={stateChip("var(--amber)")}>In progress</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: MONO,
                    fontSize: 12,
                    color: "var(--ink3)",
                  }}
                >
                  Onboarding v2
                </span>
              </div>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: 28,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                }}
              >
                Ship onboarding checklist v2
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                  gap: 12,
                  paddingTop: 14,
                  borderTop: "1px solid var(--line2)",
                }}
              >
                {[
                  ["Assignee", "Mira Okafor", false],
                  ["Due", "Oct 18", true],
                  ["Tracked", "01:24:36", true],
                ].map(([name, value, mono]) => (
                  <div key={String(name)}>
                    <div style={{ ...label, fontSize: 10 }}>{name}</div>
                    <div
                      style={{
                        fontFamily: mono ? MONO : undefined,
                        fontSize: 14,
                        marginTop: 4,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: MONO,
                  fontSize: 11,
                  color: "var(--ink3)",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 99,
                    background: "var(--accent)",
                  }}
                />
                {attached} of 5 linked
              </div>
            </div>
          </div>
          <div
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "var(--attCols)",
              columnGap: 120,
              padding: "64px var(--attPR) var(--sec) var(--attPL)",
            }}
          >
            {ATTACHMENTS.map((a, i) => {
              const on = attOn[i]!;
              const col2 = !m && i % 2 === 1;
              const side: CSSProperties = m
                ? { left: -24, width: 24 }
                : col2
                  ? { left: -60, width: 60 }
                  : { right: -60, width: 60 };
              const nside: CSSProperties = m
                ? { left: -28.5 }
                : col2
                  ? { left: -64.5 }
                  : { right: -64.5 };

              return (
                <div
                  key={a.kind}
                  style={
                    m
                      ? {
                          gridColumn: "1",
                          position: "relative",
                          marginTop: i ? 28 : 0,
                        }
                      : {
                          gridColumn: col2 ? "2" : "1",
                          gridRow: String(i + 1),
                          justifySelf: col2 ? "start" : "end",
                          width: "100%",
                          maxWidth: 380,
                          position: "relative",
                          marginTop: i ? -40 : 0,
                        }
                  }
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: 30,
                      height: 1.5,
                      ...side,
                      ...(on ? solidLine : dashed("h")),
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: 26.25,
                      ...nside,
                      ...nodeStyle(on),
                    }}
                  />
                  <div
                    data-dim={a.live ? undefined : ""}
                    style={{
                      opacity: on ? (a.live ? 1 : 0.6) : 0.28,
                      transform: on
                        ? "none"
                        : `translateX(${m ? 16 : col2 ? 28 : -28}px)`,
                      transition: trans ?? "all .5s cubic-bezier(.2,.7,.2,1)",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "var(--tile)",
                        backgroundImage: "var(--glass)",
                        border: "1px solid var(--line)",
                        borderRadius: 20,
                        boxShadow: "var(--shadow)",
                        padding: "16px 18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: a.tint,
                            border: "1px solid var(--line2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: MONO,
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {a.icon}
                        </span>
                        <span style={label}>{a.kind}</span>
                        {a.live ? (
                          <span
                            style={{
                              marginLeft: "auto",
                              fontFamily: MONO,
                              fontSize: 11,
                              color: "var(--green)",
                            }}
                          >
                            ● Live
                          </span>
                        ) : (
                          <span
                            style={{
                              marginLeft: "auto",
                              fontFamily: MONO,
                              fontSize: 11,
                              color: "var(--ink3)",
                              border: "1px solid var(--line)",
                              borderRadius: 999,
                              padding: "1px 8px",
                            }}
                          >
                            Coming
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          lineHeight: 1.35,
                        }}
                      >
                        {a.title}
                      </div>
                      <div
                        style={{
                          fontFamily: MONO,
                          fontSize: 11,
                          color: "var(--ink3)",
                        }}
                      >
                        {a.meta}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--ink2)",
                        padding: "10px 4px 0",
                      }}
                    >
                      {a.caption}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Modules */}
        <section
          id="modules"
          style={{
            position: "relative",
            padding: "var(--sec) var(--pr) 0 var(--px)",
            scrollMarginTop: 64,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "calc(var(--tx) - 0.75px)",
              top: 0,
              bottom: 0,
              width: 1.5,
              ...dashed("v"),
            }}
          >
            <div style={fill("s4")} />
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 32,
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <h2
              style={{
                margin: 0,
                maxWidth: 680,
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: "var(--h2)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                textWrap: "balance",
              }}
            >
              Switch on only the <em style={accentWord}>modules</em> you use.
            </h2>
            <div
              style={{
                maxWidth: 380,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: "var(--ink2)",
                }}
              >
                Each module joins the same workspace. Turn one on and it already
                knows your people, roles and projects.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  fontFamily: MONO,
                  fontSize: 12,
                  color: "var(--ink2)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      background: "var(--green)",
                    }}
                  />
                  7 live
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--ink3)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      border: "1px solid var(--ink3)",
                    }}
                  />
                  11 coming
                </span>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 56,
              marginTop: 88,
            }}
          >
            {GROUPS.map(([name, tint, tiles], gi) => {
              const on = f.s4 >= (gi + 1) / 5;
              const live = tiles.filter((t) => t[3]).length;

              return (
                <div
                  key={name}
                  style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "var(--gCols)",
                    gap: "20px 32px",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: 52,
                      left: "calc(var(--tx) - var(--px))",
                      width: "calc(var(--px) - var(--tx) - 12px)",
                      height: 1.5,
                      ...(on ? solidLine : dashed("h")),
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: 48.25,
                      left: "calc(var(--tx) - var(--px) - 4.5px)",
                      ...nodeStyle(on),
                    }}
                  />
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        letterSpacing: ".06em",
                        color: "var(--ink3)",
                      }}
                    >
                      0{gi + 1}
                    </span>
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: DISPLAY,
                        fontWeight: 700,
                        fontSize: 28,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {name}
                    </h3>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 12,
                        color: "var(--ink3)",
                      }}
                    >
                      {live} live · {tiles.length - live} coming
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(var(--bCols), minmax(0,1fr))",
                      gridAutoRows: "var(--bRow)",
                      gridAutoFlow: "dense",
                      gap: 12,
                    }}
                  >
                    {tiles.map(
                      ([
                        tn,
                        ic,
                        line,
                        isLive,
                        cols,
                        rows,
                        mcols,
                        prev,
                        tintOverride,
                      ]) => {
                        const showPrev = prev && !(m && prev === "docs");

                        return (
                          <div
                            key={tn}
                            data-dim={isLive ? undefined : ""}
                            className={isLive ? "l-lift" : undefined}
                            style={{
                              gridColumn: `span ${m ? mcols : cols}`,
                              gridRow: !m && rows > 1 ? `span ${rows}` : "auto",
                              display: "flex",
                              opacity: isLive ? 1 : 0.5,
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                backgroundColor: "var(--tile)",
                                backgroundImage: "var(--glass)",
                                border: "1px solid var(--line)",
                                borderRadius: 20,
                                boxShadow: "var(--shadow)",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: 52,
                                  flex: "none",
                                  background: tintOverride ?? tint,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "0 14px 0 11px",
                                }}
                              >
                                <span
                                  style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 9,
                                    background: "var(--chip-bg)",
                                    border: "1px solid var(--line2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontFamily: MONO,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    color: "var(--ink)",
                                  }}
                                >
                                  {ic}
                                </span>
                                {isLive ? (
                                  <span
                                    style={{
                                      fontFamily: MONO,
                                      fontSize: 11,
                                      color: "var(--ink)",
                                      background: "var(--chip-bg)",
                                      borderRadius: 999,
                                      padding: "3px 9px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                  >
                                    ● Live
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontFamily: MONO,
                                      fontSize: 11,
                                      color: "var(--ink2)",
                                      border: "1px dashed var(--ink3)",
                                      borderRadius: 999,
                                      padding: "2px 9px",
                                    }}
                                  >
                                    Coming
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  padding: "14px 18px 18px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 17,
                                    fontWeight: 600,
                                    letterSpacing: "-0.01em",
                                  }}
                                >
                                  {tn}
                                </span>
                                <span
                                  style={{
                                    fontSize: 14,
                                    lineHeight: 1.45,
                                    color: "var(--ink2)",
                                    textWrap: "pretty",
                                  }}
                                >
                                  {line}
                                </span>
                                {showPrev ? (
                                  <div
                                    style={{
                                      marginTop: 10,
                                      display: "flex",
                                      flexDirection: "column",
                                    }}
                                  >
                                    {PREVIEWS[prev]!.map(([a, b, s, color]) => (
                                      <div
                                        key={a}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 10,
                                          padding: "8px 0",
                                          borderTop: "1px solid var(--line2)",
                                          fontSize: 13,
                                        }}
                                      >
                                        <span
                                          style={{
                                            flex: 1,
                                            minWidth: 0,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          }}
                                        >
                                          {a}
                                        </span>
                                        <span
                                          style={{
                                            fontFamily: MONO,
                                            fontSize: 11,
                                            color: "var(--ink3)",
                                          }}
                                        >
                                          {b}
                                        </span>
                                        <span
                                          style={{
                                            fontFamily: MONO,
                                            fontSize: 11,
                                            color: color || "var(--ink3)",
                                            ...(color
                                              ? {
                                                  background: `color-mix(in oklab, ${color} 15%, transparent)`,
                                                  padding: "2px 8px",
                                                  borderRadius: 999,
                                                }
                                              : {}),
                                          }}
                                        >
                                          {s}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p
            style={{
              margin: "56px 0 0",
              maxWidth: 820,
              fontSize: 17,
              lineHeight: 1.55,
              color: "var(--ink2)",
              paddingLeft: "var(--repPL)",
              textWrap: "pretty",
            }}
          >
            Replaces the issue tracker, wiki, file drive, team chat, shared
            inbox, calendar, HR and payroll software, help desk and form builder
            you pay for separately.
          </p>
        </section>

        {/* 5. Control */}
        <section
          id="control"
          style={{
            position: "relative",
            padding: "var(--sec) var(--pr) 0 var(--px)",
            scrollMarginTop: 64,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "calc(var(--tx) - 0.75px)",
              top: 0,
              bottom: 0,
              width: 1.5,
              ...dashed("v"),
            }}
          >
            <div style={fill("s5")} />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              maxWidth: 760,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: "var(--h2)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                textWrap: "balance",
              }}
            >
              One permission <em style={accentWord}>system</em> for every
              module.
            </h2>
            <p
              style={{
                margin: 0,
                maxWidth: 520,
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--ink2)",
                textWrap: "pretty",
              }}
            >
              Roles apply across the workspace, so access to a project carries
              to its tasks and docs. Every change is written to the audit log.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              alignItems: "flex-start",
              marginTop: 64,
            }}
          >
            <div
              style={{
                flex: "1 1 620px",
                minWidth: 0,
                backgroundColor: "var(--tile)",
                backgroundImage: "var(--glass)",
                border: "1px solid var(--line)",
                borderRadius: 20,
                boxShadow: "var(--shadow)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--line2)",
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600 }}>Roles</span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: "var(--ink3)",
                  }}
                >
                  Fernway · 24 people
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: MONO,
                    fontSize: 11,
                    color: "var(--ink3)",
                  }}
                >
                  Editing: Member
                </span>
              </div>
              <div role="table" aria-label="Permission matrix">
                <div
                  role="row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "var(--mxCols)",
                    height: 52,
                    alignItems: "stretch",
                  }}
                >
                  <div
                    role="columnheader"
                    style={{
                      ...label,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 20px",
                    }}
                  >
                    Permission
                  </div>
                  {["Owner", "Admin", "Member", "Guest"].map((role, i) => (
                    <div
                      key={role}
                      role="columnheader"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          i === mx
                            ? "color-mix(in oklab, var(--accent) 9%, transparent)"
                            : "transparent",
                      }}
                    >
                      <span
                        style={
                          i === mx
                            ? {
                                fontFamily: MONO,
                                fontSize: 11,
                                padding: "4px 10px",
                                borderRadius: 999,
                                background: "var(--accent)",
                                color: "var(--accent-ink)",
                              }
                            : {
                                fontFamily: MONO,
                                fontSize: 11,
                                color: "var(--ink2)",
                              }
                        }
                      >
                        {role}
                      </span>
                    </div>
                  ))}
                </div>
                {MATRIX.map(([mod, act, values]) => (
                  <div
                    key={`${mod}-${act}`}
                    role="row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "var(--mxCols)",
                      minHeight: 46,
                      borderTop: "1px solid var(--line2)",
                    }}
                  >
                    <div
                      role="rowheader"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 20px",
                        fontSize: 14,
                        minWidth: 0,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{mod}</span>
                      <span style={{ color: "var(--ink2)" }}>{act}</span>
                    </div>
                    {values.map((v, i) => (
                      <div
                        key={i}
                        role="cell"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            i === mx
                              ? "color-mix(in oklab, var(--accent) 9%, transparent)"
                              : "transparent",
                        }}
                      >
                        {v === 2 ? (
                          <span
                            aria-label="Full access"
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 99,
                              background: "var(--ink)",
                            }}
                          />
                        ) : v === 1 ? (
                          <span
                            aria-label="Own only"
                            style={{
                              fontFamily: MONO,
                              fontSize: 10,
                              color: "var(--ink2)",
                              border: "1px solid var(--line)",
                              borderRadius: 99,
                              padding: "1px 7px",
                            }}
                          >
                            own
                          </span>
                        ) : (
                          <span
                            data-dim=""
                            aria-label="No access"
                            style={{
                              width: 10,
                              height: 1.5,
                              background: "var(--ink3)",
                              opacity: 0.6,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                flex: "0 1 380px",
                minWidth: 0,
                marginTop: "var(--panelMT)",
                backgroundColor: "var(--tile)",
                backgroundImage: "var(--glass)",
                border: "1px solid var(--line)",
                borderRadius: 20,
                boxShadow: "var(--shadow)",
                padding: "8px 8px 10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  padding: "12px 12px 10px",
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600 }}>Modules</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: MONO,
                    fontSize: 11,
                    color: "var(--ink3)",
                  }}
                >
                  Org-wide
                </span>
              </div>
              {(
                [
                  ["Projects", !projOff, false, "Used by Tasks"],
                  ["Tasks", true, false, "Needs Projects"],
                  ["Docs", true, false, "Live"],
                  ["Teams", true, false, "Live"],
                  ["Chat", false, true, "Coming"],
                  ["Calendar", false, true, "Coming"],
                  ["HR", false, true, "Coming"],
                ] as const
              ).map(([name, isOn, soon, sub]) => {
                const warn = name === "Projects" && projOff;

                return (
                  <div key={name}>
                    <div
                      data-dim={soon ? "" : undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 12,
                        opacity: soon ? 0.45 : 1,
                        background: warn ? "var(--tile2)" : "transparent",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                          {name}
                        </div>
                        <div
                          style={{
                            fontFamily: MONO,
                            fontSize: 11,
                            color: "var(--ink3)",
                            marginTop: 2,
                          }}
                        >
                          {sub}
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isOn}
                        aria-label={`${name} module`}
                        disabled={soon || name !== "Projects"}
                        onClick={
                          name === "Projects"
                            ? () => setProjOff((v) => !v)
                            : undefined
                        }
                        style={{
                          flex: "none",
                          width: 36,
                          height: 20,
                          borderRadius: 99,
                          position: "relative",
                          cursor:
                            soon || name !== "Projects" ? "default" : "pointer",
                          background: isOn ? "var(--ink)" : "var(--line)",
                          border: soon ? "1px dashed var(--ink3)" : "none",
                          boxSizing: "border-box",
                          padding: 0,
                          transition: trans ?? "background .2s",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: soon ? 1 : 2,
                            left: isOn ? 18 : 2,
                            width: 16,
                            height: 16,
                            borderRadius: 99,
                            background: isOn ? "var(--bg)" : "var(--tile)",
                            boxShadow: "var(--knob-shadow)",
                            transition: trans ?? "left .2s",
                          }}
                        />
                      </button>
                    </div>
                    {warn ? (
                      <div
                        role="status"
                        style={{
                          margin: "2px 4px 8px",
                          padding: 14,
                          borderRadius: 12,
                          border: "1px solid var(--line)",
                          background: "var(--tile2)",
                          display: "flex",
                          gap: 12,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            flex: "none",
                            width: 22,
                            height: 22,
                            borderRadius: 99,
                            border: "1.5px solid var(--ink)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: MONO,
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          !
                        </span>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          <div style={{ fontSize: 14, lineHeight: 1.45 }}>
                            <strong style={{ fontWeight: 600 }}>
                              Tasks needs Projects.
                            </strong>{" "}
                            <span style={{ color: "var(--ink2)" }}>
                              Turn off Tasks first, or keep Projects on.
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setProjOff(false)}
                              style={{
                                height: 32,
                                padding: "0 14px",
                                borderRadius: 12,
                                border: "none",
                                background: "var(--btn)",
                                color: "var(--btn-ink)",
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: "pointer",
                              }}
                            >
                              Keep Projects on
                            </button>
                            <button
                              type="button"
                              style={{
                                height: 32,
                                padding: "0 14px",
                                borderRadius: 12,
                                border: "1px solid var(--line)",
                                background: "transparent",
                                color: "var(--ink)",
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                            >
                              Turn off both
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              position: "relative",
              margin: "72px calc(-1 * var(--pr)) 0 calc(-1 * var(--px))",
              padding: "0 var(--pr) 0 var(--px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                paddingBottom: 20,
              }}
            >
              <span style={label}>Audit log</span>
              <span
                style={{ fontFamily: MONO, fontSize: 11, color: "var(--ink3)" }}
              >
                Today · Oct 14
              </span>
            </div>
            {!m ? (
              <div style={{ position: "relative" }}>
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "calc(var(--tx) - var(--px))",
                    right: 0,
                    top: 4,
                    height: 1.5,
                    ...dashed("h"),
                  }}
                >
                  <div style={fill("s5x")} />
                </div>
                <ol
                  style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "repeat(5,minmax(0,1fr))",
                    gap: 24,
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                  }}
                >
                  {AUDIT.map(([time, who, what], i) => (
                    <li
                      key={time}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          ...nodeStyle(auditProgress >= (i + 0.5) / 5),
                          position: "relative",
                          zIndex: 1,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: 12,
                          color: "var(--ink3)",
                          marginTop: 8,
                        }}
                      >
                        {time}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          lineHeight: 1.45,
                          color: "var(--ink2)",
                        }}
                      >
                        <span style={{ color: "var(--ink)", fontWeight: 500 }}>
                          {who}
                        </span>{" "}
                        {what}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <ol
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                }}
              >
                {AUDIT.map(([time, who, what], i) => (
                  <li
                    key={time}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: "calc(var(--tx) - var(--px) - 4.5px)",
                        top: 4,
                        ...nodeStyle(auditProgress >= (i + 0.5) / 5),
                      }}
                    />
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 12,
                        color: "var(--ink3)",
                      }}
                    >
                      {time}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        lineHeight: 1.45,
                        color: "var(--ink2)",
                      }}
                    >
                      <span style={{ color: "var(--ink)", fontWeight: 500 }}>
                        {who}
                      </span>{" "}
                      {what}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div style={{ height: "var(--sec)" }} />
        </section>

        {/* 6. Close */}
        <section
          style={{
            position: "relative",
            padding: "0 var(--pr) 0 var(--ctaPL)",
            textAlign: "var(--ctaAlign)" as CSSProperties["textAlign"],
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "30%",
              width: 140,
              background:
                "linear-gradient(to bottom, transparent, var(--beam) 60%, transparent)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              width: 240,
              marginLeft: -120,
              background:
                "linear-gradient(to bottom, var(--beam), transparent 90%)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "68%",
              width: 120,
              background:
                "linear-gradient(to bottom, transparent, var(--beam) 50%, transparent)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "var(--ctaX)",
              top: 160,
              width: 1200,
              height: 760,
              marginLeft: -600,
              background:
                "radial-gradient(closest-side, var(--halo), transparent)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 120,
              height: 700,
              background:
                "radial-gradient(closest-side, var(--wash), transparent)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "calc(var(--tx) - 0.75px)",
              top: 0,
              height: 120,
              width: 1.5,
              ...dashed("v"),
            }}
          >
            <div style={fill("s6a")} />
          </div>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "var(--tx)",
              top: 120,
              width: "calc(var(--ctaX) - var(--tx))",
              height: 1.5,
              ...dashed("h"),
            }}
          >
            <div style={fill("s6b")} />
          </div>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "calc(var(--ctaX) - 0.75px)",
              top: 120,
              height: 110,
              width: 1.5,
              ...dashed("v"),
            }}
          >
            <div style={fill("s6c")} />
          </div>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "calc(var(--ctaX) - 7px)",
              top: 226,
            }}
          >
            <div
              className={endOn ? "l-ping" : undefined}
              style={{
                width: 14,
                height: 14,
                borderRadius: 99,
                background: endOn ? "var(--accent)" : "var(--bg)",
                border: endOn ? "none" : "1.5px solid var(--track)",
                boxSizing: "border-box",
                boxShadow: endOn
                  ? "0 0 0 6px color-mix(in oklab, var(--accent) 22%, transparent), 0 0 24px var(--accent)"
                  : "none",
                transition: trans ?? "all .3s",
              }}
            />
          </div>
          <div
            style={{
              position: "relative",
              paddingTop: 290,
              maxWidth: 1100,
              margin: "var(--ctaM)",
              display: "flex",
              flexDirection: "column",
              gap: 28,
              alignItems: "var(--ctaJ)" as CSSProperties["alignItems"],
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: "var(--h3)",
                lineHeight: 0.95,
                letterSpacing: "-0.045em",
                textWrap: "balance",
              }}
            >
              Start with what’s <em style={accentWord}>live</em>. Add modules as
              they ship.
            </h2>
            <p
              style={{
                margin: 0,
                maxWidth: 520,
                fontSize: "var(--lead)",
                lineHeight: 1.5,
                color: "var(--ink2)",
              }}
            >
              Projects, Tasks, Teams, Docs, roles and the audit log are ready
              today.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                justifyContent:
                  "var(--ctaJ)" as CSSProperties["justifyContent"],
              }}
            >
              <Link
                href={paths.auth.signUp()}
                className="l-btn"
                style={primaryPill(56, 30, 16)}
              >
                Start free
              </Link>
              <a
                href="#modules"
                className="l-btn"
                style={ghostPill(56, 26, 16)}
              >
                See the modules
              </a>
            </div>
          </div>
          <div style={{ height: "var(--sec)" }} />
        </section>
      </main>

      <footer
        style={{
          position: "relative",
          borderTop: "1px solid var(--line2)",
          padding: "56px var(--pr) 48px var(--px)",
          display: "flex",
          flexWrap: "wrap",
          gap: "48px 64px",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minWidth: 200,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {logoMark(22, 7, 12)}
            <span
              style={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: "-0.04em",
              }}
            >
              Zentro
            </span>
          </div>
          <span style={{ fontSize: 14, color: "var(--ink2)" }}>
            The operating system for startups.
          </span>
          <span
            style={{ fontFamily: MONO, fontSize: 11, color: "var(--ink3)" }}
          >
            © 2026 Zentro
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            flex: "1 1 360px",
            maxWidth: 460,
          }}
        >
          <span style={label}>Modules</span>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 16px",
              fontSize: 14,
            }}
          >
            {FOOT_LIVE.map((name) => (
              <a
                key={name}
                href="#modules"
                style={{ color: "var(--ink)", textDecoration: "none" }}
              >
                {name}
              </a>
            ))}
          </div>
          <div
            data-dim=""
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 16px",
              fontSize: 14,
              color: "var(--ink3)",
              opacity: 0.7,
            }}
          >
            {FOOT_SOON.map((name) => (
              <span key={name}>{name}</span>
            ))}
            <span style={{ fontFamily: MONO, fontSize: 11 }}>coming</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontSize: 14,
          }}
        >
          <span style={label}>Legal</span>
          {["Privacy", "Terms", "Security", "Cookies"].map((name) => (
            <a
              key={name}
              href="#top"
              style={{ color: "var(--ink2)", textDecoration: "none" }}
            >
              {name}
            </a>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={label}>Theme</span>
          <div
            role="group"
            aria-label="Theme"
            style={{
              display: "flex",
              gap: 2,
              padding: 3,
              border: "1px solid var(--line)",
              borderRadius: 999,
              alignSelf: "flex-start",
            }}
          >
            <Segment
              active={mode === "light"}
              onClick={() => chooseMode("light")}
            >
              Light
            </Segment>
            <Segment
              active={mode === "dark"}
              onClick={() => chooseMode("dark")}
            >
              Dark
            </Segment>
            <Segment
              active={mode === "system"}
              onClick={() => chooseMode("system")}
            >
              System
            </Segment>
          </div>
        </div>
      </footer>
    </div>
  );
}
