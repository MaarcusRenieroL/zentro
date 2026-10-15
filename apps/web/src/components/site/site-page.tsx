"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
// The marketing site pages (Modules, Module, Pricing, Roadmap, Security,
// Changelog, Legal, About, Status). One shared shell, thread and scroll state;
// the markup is in site-template.tsx and the content in site-data.ts.
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  AUDIT,
  CHAIN,
  CL,
  CLCHIP,
  COMP,
  COMPARE,
  DARK,
  FAQ,
  GROUPS,
  INC,
  LD,
  LEGAL,
  LIGHT,
  LM,
  LOREM,
  MATRIX,
  MD,
  MODBY,
  MODS,
  PLANS,
  PPL,
  PREV,
  PROJ,
  ROLES,
  TINT,
  TL,
  TOPICS,
  clamp,
  ic,
  mono,
} from "./site-data";
import { SiteTemplate } from "./site-template";

export type SitePageName =
  | "pricing"
  | "modules"
  | "module"
  | "roadmap"
  | "security"
  | "changelog"
  | "legal"
  | "about"
  | "status";

type Props = {
  page: SitePageName;
  module?: "tasks" | "docs";
  doc?: "privacy" | "terms" | "cookies";
};

type Mode = "dark" | "light" | "system";

// Shared with the landing page so the theme carries across.
const storageKey = "zentro-landing-theme";

const initialState = {
  P: null as number | null,
  vw: null as number | null,
  on: null as Record<string, boolean> | null,
  rv: null as Record<string, boolean> | null,
  billing: null as string | null,
  planM: 1,
  add: { Chat: 1, Calendar: 1 } as Record<string, number>,
  faq: 0,
  filt: null as string | null,
  notify: {} as Record<string, boolean>,
  cl: "All",
  menuO: null as boolean | null,
  toc: 0,
  tocOpen: false,
  f: { name: "", email: "", topic: "", msg: "" },
  touched: {} as Record<string, number>,
  submitted: false,
  sent: false,
};

export function SitePage(props: Props) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const lastKey = useRef("");
  const [state, setState] = useState<any>(initialState);
  const [mode, setMode] = useState<Mode>("dark");
  const [sysLight, setSysLight] = useState(false);
  const [rm, setRm] = useState(false);

  const setS = useCallback(
    (update: any) =>
      setState((prev: any) => ({
        ...prev,
        ...(typeof update === "function" ? update(prev) : update),
      })),
    [],
  );

  const chooseMode = (next: Mode) => {
    setMode(next);

    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Not remembered, still switched.
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);

      if (saved === "light" || saved === "dark" || saved === "system") {
        setMode(saved);
      }
    } catch {
      // Storage can be blocked; dark is the default.
    }

    const light = window.matchMedia("(prefers-color-scheme: light)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setSysLight(light.matches);
      setRm(reduce.matches);
    };

    update();
    light.addEventListener("change", update);
    reduce.addEventListener("change", update);

    return () => {
      light.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  // One scroll value drives the Thread; each node lights as the line reaches it.
  const tick = useCallback(() => {
    const root = rootRef.current;
    const line = lineRef.current;

    if (!root) return;

    const ih = window.innerHeight;
    const box = root.getBoundingClientRect();
    const P = clamp((ih * 0.6 - box.top) / Math.max(1, box.height - ih * 0.4));
    const rv: Record<string, boolean> = {};
    const on: Record<string, boolean> = {};

    root.querySelectorAll<HTMLElement>("[data-rv]").forEach((el) => {
      rv["r" + el.dataset.rv] = el.getBoundingClientRect().top < ih * 0.88;
    });

    if (line) {
      const lr = line.getBoundingClientRect();
      const limit = lr.top + P * lr.height + 2;

      root.querySelectorAll<HTMLElement>("[data-nd]").forEach((el) => {
        on[el.dataset.nd!] = el.getBoundingClientRect().top <= limit;
      });
    }

    const vw = root.offsetWidth;
    const key = JSON.stringify([rv, on, vw]);

    setState((prev: any) => {
      if (
        key === lastKey.current &&
        prev.P !== null &&
        Math.abs(P - prev.P) <= 0.002
      ) {
        return prev;
      }

      lastKey.current = key;

      return { ...prev, P, rv, on, vw };
    });
  }, []);

  useEffect(() => {
    const onScroll = () => tick();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    requestAnimationFrame(onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [tick]);

  // Filters and tabs change the page height, so the nodes are measured again.
  useEffect(() => {
    requestAnimationFrame(tick);
  }, [state.filt, state.cl, props.page, props.module, props.doc, tick]);

  const vals = (() => {
    const p: any = props;
    const s: any = state;
    const st = false;
    const theme = mode === "system" ? (sysLight ? "light" : "dark") : mode;
    const m = !!p.mobile || (!st && (s.vw ?? 1440) < 1000);
    const page = p.page;
    const only = p.only || "all";
    const P = st ? (p.progress ?? 1) : (s.P ?? 0);
    const quiet = ["legal", "status", "about"].includes(page);
    const isOn = (k: any) => P >= 0.999 || !!(s.on && s.on[k]);
    const ndS = (o: any) => ({
      display: "block",
      width: 9,
      height: 9,
      borderRadius: 999,
      boxSizing: "border-box",
      background: o ? "var(--accent)" : "var(--bg)",
      border: o ? "none" : "1.5px solid var(--track)",
      boxShadow: o
        ? "0 0 0 4px color-mix(in oklab, var(--accent) 20%, transparent), var(--glow)"
        : "none",
      transition: "all .3s",
    });
    const lineS = (o: any, dir: any) =>
      o
        ? { background: "var(--accent)", boxShadow: "var(--glow)" }
        : {
            backgroundImage: `repeating-linear-gradient(${dir === "h" ? "to right" : "to bottom"}, var(--track) 0 4px, transparent 4px 9px)`,
          };
    const nd: Record<string, any> = {};
    for (let i = 0; i < 12; i++) {
      const k = "k" + i;
      nd[k] = quiet && i > 0 ? { display: "none" } : ndS(isOn(k));
    }
    const ease = "cubic-bezier(.2,.7,.2,1)";
    const rvS = (o: any) =>
      st || rm
        ? {}
        : o
          ? {
              opacity: 1,
              transform: "none",
              transition: `opacity .8s ${ease}, transform .8s ${ease}`,
            }
          : {
              opacity: 0,
              transform: "translateY(32px) scale(.98)",
              transition: `opacity .5s ${ease}, transform .5s ${ease}`,
            };
    const rvOn = (i: any) => !s.rv || s.rv["r" + i] !== false;
    const rv: Record<string, any> = {};
    for (let i = 0; i < 40; i++) rv["r" + i] = rvS(rvOn(i));
    const track = quiet
      ? { position: "absolute", inset: 0, background: "var(--line2)" }
      : {
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(to bottom, var(--track) 0 4px, transparent 4px 10px)",
        };
    const fill = quiet
      ? { display: "none" }
      : {
          position: "absolute",
          inset: 0,
          background: "var(--accent)",
          boxShadow: "var(--glow)",
          transformOrigin: "top",
          transform: `scaleY(${P})`,
          transition: st ? "none" : "transform .25s linear",
        };
    const endOn = P >= 0.985;

    const prevent = (e?: any) => {
      if (e && e.preventDefault) e.preventDefault();
    };
    const route = (k: string, extra?: any): string =>
      k === "home"
        ? "/"
        : k === "legal"
          ? (
              {
                privacy: "/privacy",
                terms: "/terms",
                cookies: "/cookies",
              } as Record<string, string>
            )[extra?.legalO ?? "privacy"]!
          : k === "module"
            ? `/modules/${extra?.modO ?? "tasks"}`
            : `/${k}`;
    const go = (k: string, extra?: any) => {
      const href = route(k, extra);
      const fn: any = (e: any) => {
        prevent(e);
        setS({ menuO: false });
        router.push(href);
      };
      fn.href = href;
      return fn;
    };
    const gos = Object.fromEntries(
      [
        "pricing",
        "modules",
        "roadmap",
        "security",
        "changelog",
        "legal",
        "about",
        "status",
      ].map((k: any) => [k, go(k)]),
    );
    const act = page === "module" ? "modules" : page;
    const navLinks = [
      ["modules", "Modules"],
      ["pricing", "Pricing"],
      ["roadmap", "Roadmap"],
      ["security", "Security"],
      ["changelog", "Changelog"],
    ].map(([k, t]: any) => ({
      t,
      go: go(k),
      st: {
        color: act === k ? "var(--ink)" : "var(--ink2)",
        fontSize: 14,
        fontWeight: act === k ? 500 : 400,
        textDecoration: "none",
        boxShadow: act === k ? "0 1px 0 var(--ink)" : "none",
      },
    }));
    const menuLinks = [
      ["home", "Product"],
      ["modules", "Modules"],
      ["pricing", "Pricing"],
      ["roadmap", "Roadmap"],
      ["security", "Security"],
      ["changelog", "Changelog"],
      ["about", "About & contact"],
      ["status", "Status"],
    ].map(([k, t]: any, i: any) => ({
      t,
      i: "0" + (i + 1),
      go: go(k),
      ar: { ...ic("fwd", 16), color: "var(--ink3)" },
      st: {
        display: "flex",
        alignItems: "center",
        height: 56,
        borderBottom: "1px solid var(--line2)",
        color: act === k ? "var(--accent)" : "var(--ink)",
        fontFamily: "'Bricolage Grotesque',sans-serif",
        fontWeight: 700,
        fontSize: 24,
        letterSpacing: "-0.03em",
        textDecoration: "none",
      },
    }));
    const menuOn = m && (s.menuO ?? !!p.menuOpen);
    const legalGo = (k: string) => go("legal", { legalO: k });

    const seg = (a: any) => ({
      height: 28,
      padding: "0 12px",
      borderRadius: 99,
      border: "none",
      cursor: "pointer",
      fontFamily: mono,
      fontSize: 11,
      letterSpacing: ".04em",
      textTransform: "uppercase",
      background: a ? "var(--ink)" : "transparent",
      color: a ? "var(--bg)" : "var(--ink2)",
    });
    const thB = (a: any) => ({
      width: 30,
      height: 30,
      padding: 0,
      borderRadius: 99,
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: a ? "var(--ink)" : "transparent",
      color: a ? "var(--bg)" : "var(--ink2)",
      transition: "background .2s, color .2s",
    });
    const seg2 = (a: any) => ({
      ...seg(a),
      height: 34,
      padding: "0 16px",
      fontSize: 12,
    });
    const codeSt = (tint: any, s0 = 32) => ({
      width: s0,
      height: s0,
      borderRadius: 9,
      flex: "none",
      background: tint,
      border: "1px solid var(--line2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: mono,
      fontSize: 11,
      fontWeight: 500,
      color: "var(--ink)",
    });
    const liveChip = {
      fontFamily: mono,
      fontSize: 11,
      color: "var(--green)",
      whiteSpace: "nowrap",
    };
    const soonChip = {
      fontFamily: mono,
      fontSize: 11,
      color: "var(--ink2)",
      border: "1px dashed var(--ink3)",
      borderRadius: 999,
      padding: "2px 9px",
      whiteSpace: "nowrap",
      justifySelf: "start",
    };
    const tog = (on: any) => ({
      track: {
        flex: "none",
        width: 36,
        height: 20,
        borderRadius: 99,
        position: "relative",
        cursor: "pointer",
        background: on ? "var(--ink)" : "var(--line)",
        transition: "background .2s",
      },
      knob: {
        position: "absolute",
        top: 2,
        left: on ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: 99,
        background: on ? "var(--bg)" : "var(--tile)",
        boxShadow: "0 1px 2px rgba(0,0,0,.2)",
        transition: "left .2s",
      },
    });
    const glyph = (stt: any) => {
      const c = {
        prog: "var(--amber)",
        review: "var(--cyan)",
        todo: "var(--ink3)",
        done: "var(--green)",
      }[stt as "prog"];
      const b = {
        width: 14,
        height: 14,
        borderRadius: 99,
        flex: "none",
        boxSizing: "border-box",
      };
      if (stt === "done") return { ...b, background: c };
      if (stt === "todo") return { ...b, border: `1.5px solid ${c}` };
      return {
        ...b,
        border: `1.5px solid ${c}`,
        padding: 2,
        backgroundClip: "content-box",
        backgroundImage: `conic-gradient(${c} 0 ${stt === "prog" ? 50 : 75}%, transparent 0)`,
      };
    };
    const av = (code: any, size = 24) => ({
      width: size,
      height: size,
      flex: "none",
      borderRadius: 99,
      background: (PPL[code] || [0, "var(--tile2)"])[1],
      border: "1px solid var(--line)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: mono,
      fontSize: 9,
      color: "var(--ink)",
    });
    const pill = (c: any) => ({
      fontFamily: mono,
      fontSize: 11,
      padding: "3px 9px",
      borderRadius: 999,
      color: c,
      background: `color-mix(in oklab, ${c} 15%, transparent)`,
      whiteSpace: "nowrap",
    });
    const cellG = (v: any) => ({
      g:
        v === 2
          ? {
              width: 10,
              height: 10,
              borderRadius: 99,
              background: "var(--ink)",
            }
          : v
            ? {
                fontFamily: mono,
                fontSize: 10,
                color: "var(--ink2)",
                border: "1px solid var(--line)",
                borderRadius: 99,
                padding: "1px 7px",
              }
            : {
                width: 10,
                height: 1.5,
                background: "var(--ink3)",
                opacity: 0.6,
              },
      t: v === 1 ? "own" : v === 3 ? "shared" : "",
    });

    // pricing
    const billing = s.billing ?? p.billing ?? "monthly",
      yr = billing === "yearly";
    const bill = [
      ["monthly", "Monthly"],
      ["yearly", "Yearly"],
    ].map(([k, l]: any) => ({
      l,
      st: seg2(billing === k),
      go: () => setS({ billing: k }),
    }));
    const plans = PLANS.map(([n, d], i) => ({
      n,
      d,
      per: yr ? "per person / month, billed yearly" : "per person / month",
      note: yr ? "Yearly discount: TBD" : "Billed every month",
      colSt: {
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: m ? "28px 0" : `36px 32px 40px ${i ? 32 : 0}px`,
        borderTop: m && i ? "1px solid var(--line2)" : "none",
        borderLeft: !m && i ? "1px solid var(--line2)" : "none",
      },
    }));
    const cols = m ? [s.planM] : [0, 1, 2];
    const cell = (v: any) =>
      v === "y"
        ? { st: ic("check", 18, "var(--ink)"), t: "" }
        : v === "tbd"
          ? {
              st: {
                fontFamily: mono,
                fontSize: 11,
                color: "var(--amber)",
                border: "1px dashed var(--amber)",
                borderRadius: 999,
                padding: "1px 8px",
              },
              t: "TBD",
            }
          : {
              st: { fontFamily: mono, fontSize: 12, color: "var(--ink2)" },
              t: v,
            };
    const soon = MODS.filter((x: any) => !x[3]);
    const addSel = soon.filter((x: any) => s.add[x[0]]).map((x: any) => x[0]);

    // modules
    const filt = s.filt ?? p.filter ?? "all";
    const rowFor = (x: any) => {
      const link = x[0] === "Tasks" || x[0] === "Docs";
      return {
        n: x[0],
        code: x[1],
        d: x[4],
        codeSt: codeSt(TINT[x[2]]),
        chipSt: x[3] ? liveChip : soonChip,
        chipT: x[3] ? "● Live" : "Coming",
        linkT: link ? "Details" : x[3] ? "" : "Roadmap",
        ar:
          link || !x[3]
            ? { ...ic("arrowR", 14), color: "currentColor" }
            : { display: "none" },
        go: link
          ? go("module", { modO: x[0].toLowerCase() })
          : x[3]
            ? prevent
            : go("roadmap"),
        rowSt: {
          display: "grid",
          gridTemplateColumns: "var(--mrCols)",
          alignItems: "center",
          gap: "12px 20px",
          padding: "18px 0",
          borderBottom: "1px solid var(--line2)",
          opacity: x[3] ? 1 : 0.55,
        },
        linkSt: {
          display: "var(--mlD)",
          alignItems: "center",
          gap: 6,
          justifyContent: "flex-end",
          fontSize: 14,
          color: link ? "var(--ink)" : "var(--ink2)",
          textDecoration: "none",
        },
      };
    };
    const mgroups = GROUPS.map((g: any, gi: any) => {
      const all = MODS.filter((x: any) => x[2] === g),
        live = all.filter((x: any) => x[3]).length;
      const rows = all
        .filter((x: any) => filt === "all" || (filt === "live") === !!x[3])
        .map(rowFor);
      const k = "k" + (gi + 1);
      return {
        name: g,
        idx: "0" + (gi + 1),
        meta: `${live} live · ${all.length - live} coming`,
        rows,
        show: rows.length > 0,
        k,
        nd: ndS(isOn(k)),
        rvk: String(gi + 2),
        rv: rv["r" + (gi + 2)],
        br: {
          position: "absolute",
          top: 38,
          left: "calc(var(--tx) - var(--px))",
          width: "calc(var(--px) - var(--tx) - 16px)",
          height: 1.5,
          ...lineS(isOn(k), "h"),
        },
      };
    });

    // module detail
    const mod = p.module ?? "tasks",
      MDx = MD[mod] || MD.tasks;
    const lkOn = isOn("k2");
    const md = {
      ...MDx,
      codeSt: codeSt(TINT[MDx.group], 40),
      lkMeta: `${MDx.links.filter((l: any) => l[1]).length} live links · ${MDx.links.filter((l: any) => !l[1]).length} coming`,
    };
    const mdLinks = MDx.links.map(([n, live, t]: any) => {
      const x = MODBY[n]!;
      return {
        n,
        t,
        code: x[1],
        codeSt: codeSt(TINT[x[2]]),
        chipSt: live ? liveChip : soonChip,
        chipT: live ? "● Live" : "Coming",
        rowSt: {
          position: "relative",
          display: "grid",
          gridTemplateColumns: "var(--lkRow)",
          alignItems: "center",
          gap: "12px 20px",
          padding: "18px 0",
          borderBottom: "1px solid var(--line2)",
          opacity: live ? 1 : 0.5,
        },
        ndSt: {
          position: "absolute",
          left: -36.25,
          top: "calc(50% - 4.5px)",
          ...ndS(live && lkOn),
        },
      };
    });
    const lkLine = {
      position: "absolute",
      left: 0,
      top: 20,
      bottom: 30,
      width: 1.5,
      ...lineS(lkOn, "v"),
    };
    const sbFor = (cur: any) =>
      [
        ["today", "Today"],
        ["tasks", "Tasks", "12"],
        ["projects", "Projects"],
        ["docs", "Docs"],
        ["team", "Team"],
      ].map(([k, l, b]: any) => ({
        l,
        b: b || "",
        ic: ic(k, 16, cur === k ? "var(--accent)" : "currentColor"),
        st: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          height: 34,
          padding: "0 10px",
          borderRadius: 10,
          fontSize: 14,
          background: cur === k ? "var(--tile2)" : "transparent",
          color: cur === k ? "var(--ink)" : "var(--ink2)",
        },
      }));
    const tl = TL.map(([stt, label, rows]: any) => ({
      label,
      count: String(rows.length),
      g: glyph(stt),
      rows: rows.map(([k, t, a, d, od]: any) => ({
        k,
        t,
        a,
        av: av(a),
        due: d,
        g: glyph(stt),
        proj: PROJ[k.split("-")[0]],
        dueSt: {
          fontFamily: mono,
          fontSize: 12,
          color: od ? "var(--rose)" : "var(--ink3)",
          width: 68,
          textAlign: "right",
          flex: "none",
        },
      })),
    }));
    const tdProps = [
      ["Status", "In progress", "var(--amber)"],
      ["Assignee", "Priya Raman"],
      ["Project", "Zentro Web"],
      ["Due", "Tomorrow"],
      ["Tracked", "01:12:40", 0, 1],
      ["Key", "ZEN-18", 0, 1],
    ].map(([k, v, c, mo]: any) => ({
      k,
      v,
      st: {
        fontSize: 14,
        marginTop: 4,
        color: c || "var(--ink)",
        fontFamily: mo ? mono : "inherit",
      },
    }));
    const tdLinks = [
      ["Project", "Zentro Web", "ZEN · 31 open tasks"],
      ["Blocks", "BIL-7 · Migrate invoices table", "Arjun · overdue Oct 11"],
      ["Related task", "ZEN-14 · Session timeout banner", "Tom · done Oct 8"],
      ["Doc", "Session handling spec", "Edited 1h ago by Priya"],
    ].map(([k, t, s0]: any) => ({ k, t, s: s0 }));
    const upNext = [
      ["ONB-14", "Invite teammates step", "Overdue", "var(--rose)"],
      ["ZEN-24", "Rate-limit the invite endpoint", "Due today", "var(--amber)"],
      ["ZEN-15", "Empty states for Docs home", "In review", "var(--cyan)"],
    ].map(([k, t, s0, c]: any) => ({ k, t, s: s0, st: pill(c) }));
    const dh = [
      [
        "Session handling spec",
        "Zentro Web",
        "2 tasks",
        "1h ago · Priya",
        "var(--peach)",
      ],
      [
        "ADR 014: Session storage",
        "Zentro Web",
        "1 task",
        "Oct 12 · Tom",
        "var(--peach)",
      ],
      ["Proration rules", "Billing", "3 tasks", "Oct 11 · Arjun", "var(--sky)"],
      [
        "Welcome email copy",
        "Onboarding",
        "2 tasks",
        "Oct 10 · Meera",
        "var(--mint)",
      ],
      ["Q4 hiring plan", "Company", "—", "Oct 6 · Lena", "var(--lav)"],
    ].map(([t, p0, l, u, c]: any) => ({
      t,
      p: p0,
      l,
      u,
      ic: {
        width: 26,
        height: 26,
        flex: "none",
        borderRadius: 8,
        background: c,
        border: "1px solid var(--line2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ink)",
      },
    }));
    const docTasks = [
      ["prog", "ZEN-18", "Fix login redirect loop on expired sessions"],
      ["done", "ZEN-14", "Session timeout banner"],
    ].map(([g, k, t]: any) => ({ g: glyph(g), k, t }));
    const share = [
      ["EN", "Engineering", "Team · 8 people", "Can edit", "var(--sky)"],
      ["PR", "Priya Raman", "Owner of this doc", "Owner"],
      ["LH", "Lena Hoffmann", "Member", "Can view"],
      [
        "G",
        "Guests",
        "People outside Northwind Labs",
        "No access",
        "var(--tile2)",
      ],
    ].map(([i, n, s0, r, c]: any) => ({
      i,
      n,
      s: s0,
      r,
      av: { ...av(i, 30), ...(c ? { background: c } : {}) },
    }));

    // roadmap
    const notifiedP = (p.notified || "")
      .split(",")
      .map((x: any) => x.trim())
      .filter(Boolean);
    const isN = (n: any) => !!s.notify[n] || notifiedP.includes(n);
    const rmGroups = GROUPS.map((g: any, gi: any) => {
      const k = "k" + (gi + 1);
      return {
        name: g,
        idx: "0" + (gi + 1),
        k,
        nd: ndS(isOn(k)),
        rvk: String(gi + 1),
        rv: rv["r" + (gi + 1)],
        br: {
          position: "absolute",
          top: 38,
          left: "calc(var(--tx) - var(--px))",
          width: "calc(var(--px) - var(--tx) - 16px)",
          height: 1.5,
          ...lineS(isOn(k), "h"),
        },
        meta: `${soon.filter((x: any) => x[2] === g).length} coming`,
        rows: soon
          .filter((x: any) => x[2] === g)
          .map((x: any) => ({
            n: x[0],
            code: x[1],
            d: x[4],
            codeSt: codeSt(TINT[g], 40),
            url: "fernway.zentro.app / " + x[0].toLowerCase(),
            prev: PREV[x[0]!]!.map(([a, b]: any) => ({ a, b })),
            isN: isN(x[0]),
            notN: !isN(x[0]),
            click: () =>
              setS((st0: any) => ({
                notify: { ...st0.notify, [x[0]]: !st0.notify[x[0]] },
              })),
            done: `We’ll email you when ${x[0]} is live.`,
          })),
      };
    }).filter((g: any) => g.rows.length);
    const allN = soon.every((x: any) => isN(x[0]));

    // security
    const secRoles = ROLES.map(([n, d], i) => ({ n, d, idx: "0" + (i + 1) }));
    const secMatrix = MATRIX.map(([mod0, a, v]: any) => ({
      mod: mod0,
      act: a,
      cells: v.map(cellG),
    }));
    const chain = CHAIN.map(([t, d], i) => ({
      t,
      d,
      i: String(i + 1),
      ndSt: { position: "absolute", left: -36.25, top: 24, ...ndS(isOn("k2")) },
    }));
    const chainLine = {
      position: "absolute",
      left: 0,
      top: 28,
      bottom: 40,
      width: 1.5,
      ...lineS(isOn("k2"), "v"),
    };
    const tagSt = (mod0: any) => {
      const g = CLCHIP[mod0];
      return {
        fontFamily: mono,
        fontSize: 11,
        color: "var(--ink)",
        background: g ? TINT[g] : "var(--chipBg)",
        border: "1px solid var(--line2)",
        borderRadius: 999,
        padding: "3px 10px",
        whiteSpace: "nowrap",
        justifySelf: "start",
        alignSelf: "start",
      };
    };
    const audit = AUDIT.map(([t, w, a, mod0]: any) => ({
      t,
      w,
      a,
      mod: mod0,
      tag: tagSt(mod0),
    }));

    // changelog
    const clF = s.cl;
    const clChips = [
      "All",
      "Projects",
      "Tasks",
      "Docs",
      "Teams",
      "Roles",
      "Audit log",
      "Modules",
      "Workspace",
    ].map((c: any) => ({
      l: c,
      go: () => setS({ cl: c }),
      st: {
        height: 32,
        padding: "0 14px",
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: mono,
        fontSize: 12,
        border: clF === c ? "1px solid var(--ink)" : "1px solid var(--line)",
        background: clF === c ? "var(--ink)" : "transparent",
        color: clF === c ? "var(--bg)" : "var(--ink2)",
      },
    }));
    const entries = CL.map((e: any, i: any) => ({
      d: e[0],
      t: e[1],
      x: e[2],
      mod: e[3],
      tag: tagSt(e[3]),
      k: "c" + i,
      nd: ndS(isOn("c" + i)),
      rvk: String(i + 2),
      rv: rv["r" + (i + 2)],
    })).filter((e: any) => clF === "All" || e.mod === clF);

    // legal
    const doc = p.doc ?? "privacy",
      L = (LEGAL[doc] || LEGAL.privacy)!;
    const legalTabs = Object.keys(LEGAL).map((k: any) => ({
      l: LEGAL[k]!.tab,
      st: seg2(doc === k),
      go: go("legal", { legalO: k }),
    }));
    const toc = L.secs.map((t: any, i: any) => ({
      t,
      n: String(i + 1).padStart(2, "0"),
      go: () => setS({ toc: i, tocOpen: false }),
      st: {
        display: "flex",
        gap: 12,
        alignItems: "baseline",
        padding: "7px 0 7px 12px",
        borderLeft:
          s.toc === i
            ? "1.5px solid var(--accent)"
            : "1.5px solid var(--line2)",
        color: s.toc === i ? "var(--ink)" : "var(--ink2)",
        fontSize: 14,
        cursor: "pointer",
        background: "none",
        borderTop: "none",
        borderRight: "none",
        borderBottom: "none",
        textAlign: "left",
      },
    }));
    const secs = L.secs.map((t: any, i: any) => ({
      t,
      n: String(i + 1).padStart(2, "0"),
      paras: (i % 3 === 1
        ? [LOREM[i % 3]]
        : [LOREM[i % 3], LOREM[(i + 1) % 3]]
      ).map((x: any) => x),
    }));

    // about / contact
    const f = s.f;
    const errs: Record<string, string> = {
      name: f.name.trim() ? "" : "Enter your name so we know who to reply to.",
      email: !f.email.trim()
        ? "Enter your email address so we can reply."
        : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())
          ? ""
          : "Enter an email address in the format name@company.com.",
      topic: f.topic
        ? ""
        : "Choose a topic so your message reaches the right person.",
      msg: !f.msg.trim()
        ? "Write a message so we know how to help."
        : f.msg.trim().length < 20
          ? `Write at least 20 characters so we have enough to go on. You have written ${f.msg.trim().length}.`
          : "",
    };
    const shown = (k: any) => !!errs[k] && (s.submitted || !!s.touched[k]);
    const fld = (k: any) => ({
      val: f[k],
      err: errs[k],
      has: shown(k),
      onChange: (e: any) => {
        const v = e.target.value;
        setS((st0: any) => ({ f: { ...st0.f, [k]: v } }));
      },
      onBlur: () =>
        setS((st0: any) => ({ touched: { ...st0.touched, [k]: 1 } })),
      inSt: {
        width: "100%",
        height: k === "msg" ? 160 : 48,
        padding: k === "msg" ? "12px 14px" : "0 14px",
        borderRadius: 12,
        border: `1px solid ${shown(k) ? "var(--rose)" : "var(--line)"}`,
        background: "var(--tile)",
        color: "var(--ink)",
        fontSize: 15,
        outline: "none",
        resize: "vertical",
        appearance: "none",
        boxShadow: shown(k)
          ? "0 0 0 3px color-mix(in oklab, var(--rose) 14%, transparent)"
          : "none",
      },
    });
    const fm = {
      name: fld("name"),
      email: fld("email"),
      topic: fld("topic"),
      msg: fld("msg"),
    };
    const errCount = ["name", "email", "topic", "msg"].filter((k: any) =>
      shown(k),
    ).length;
    const submit = (e: any) => {
      prevent(e);
      const bad = Object.values(errs).some(Boolean);
      setS({ submitted: true, sent: !bad });
    };

    // status
    const inc = (p.statusState ?? "ok") === "incident";
    const comps = COMP.map((n: any) => {
      const bad = inc && n === "Search";
      return {
        n,
        s: bad ? "Degraded performance" : "Operational",
        dot: {
          width: 8,
          height: 8,
          borderRadius: 99,
          flex: "none",
          background: bad ? "var(--amber)" : "var(--green)",
        },
        tSt: {
          fontFamily: mono,
          fontSize: 12,
          color: bad ? "var(--amber)" : "var(--ink2)",
          whiteSpace: "nowrap",
        },
      };
    });
    const stDot = {
      width: 14,
      height: 14,
      borderRadius: 99,
      flex: "none",
      background: inc ? "var(--amber)" : "var(--green)",
      boxShadow: `0 0 0 6px color-mix(in oklab, ${inc ? "var(--amber)" : "var(--green)"} 18%, transparent)`,
    };
    const incUpd = INC.map(([t, s0, x], i) => ({
      t,
      s: s0,
      x,
      st: pill(i === 0 ? "var(--cyan)" : "var(--amber)"),
    }));

    const showMain = only === "all";
    const closeCopy: Record<string, any> = {
      pricing: [
        "Start free now. You can pick a plan once pricing is published.",
        "See the modules",
        "modules",
      ],
      modules: [
        "Projects, Tasks, Docs, Teams, roles, the audit log and module settings are live today.",
        "See the roadmap",
        "roadmap",
      ],
      module: [MDx.closeLead, "All modules", "modules"],
      roadmap: [
        "Seven modules are ready today. Coming modules join the same workspace when they ship.",
        "See the modules",
        "modules",
      ],
      security: [
        "Start free, invite your team and choose who can do what before anyone creates a task.",
        "Contact us",
        "about",
      ],
      changelog: [
        "Every change on this page is live in all workspaces.",
        "See the roadmap",
        "roadmap",
      ],
    };
    const cc = closeCopy[page];

    return {
      rootRef,
      lineRef,
      m,
      notM: !m,
      rootStyle: {
        ...(theme === "light" ? LIGHT : DARK),
        ...(m ? LM : LD),
        position: "relative",
        overflowX: "clip",
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "'Geist', system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
        minHeight: only === "nav" && menuOn ? 844 : undefined,
      },
      showNav: only === "all" || only === "nav",
      showMain,
      showFooter: only === "all" || only === "footer",
      showClose: showMain && !!cc,
      menuOn,
      pg: {
        pricing: page === "pricing",
        modules: page === "modules",
        module: page === "module",
        roadmap: page === "roadmap",
        security: page === "security",
        changelog: page === "changelog",
        legal: page === "legal",
        about: page === "about",
        status: page === "status",
      },
      cl: {
        pricing: page === "pricing",
        modules: page === "modules",
        module: page === "module",
        roadmap: page === "roadmap",
        security: page === "security",
        changelog: page === "changelog",
      },
      closeLead: cc ? cc[0] : "",
      close2: { t: cc ? cc[1] : "", go: cc ? go(cc[2]) : prevent },
      nd,
      rv,
      track,
      fill,
      fillEnd: quiet
        ? { display: "none" }
        : {
            position: "absolute",
            inset: 0,
            background: "var(--accent)",
            boxShadow: "var(--glow)",
            transformOrigin: "top",
            transform: `scaleY(${endOn ? 1 : 0})`,
            transition: "transform .4s",
          },
      endNode: {
        width: 14,
        height: 14,
        borderRadius: 99,
        boxSizing: "border-box",
        background: endOn ? "var(--accent)" : "var(--bg)",
        border: endOn ? "none" : "1.5px solid var(--track)",
        boxShadow: endOn
          ? "0 0 0 6px color-mix(in oklab, var(--accent) 22%, transparent), 0 0 24px var(--accent)"
          : "none",
        transition: "all .3s",
      },
      th: {
        light: thB(mode === "light"),
        dark: thB(mode === "dark"),
        sys: thB(mode === "system"),
      },
      thIc: {
        light: ic("sun", 15),
        dark: ic("moon", 15),
        sys: ic("monitor", 15),
      },
      setLight: () => chooseMode("light"),
      setDark: () => chooseMode("dark"),
      setSys: () => chooseMode("system"),
      toggleMenu: () => setS({ menuO: !menuOn }),
      menuIc: ic(menuOn ? "x" : "menu", 18),
      go: gos,
      navLinks,
      menuLinks,
      footProduct: [
        ["modules", "Modules"],
        ["pricing", "Pricing"],
        ["roadmap", "Roadmap"],
        ["changelog", "Changelog"],
        ["status", "Status"],
      ].map(([k, t]: any) => ({ t, go: go(k) })),
      footCompany: [
        ["about", "About"],
        ["about", "Contact"],
        ["security", "Security"],
      ].map(([k, t]: any) => ({ t, go: go(k) })),
      footLegal: [
        ["privacy", "Privacy"],
        ["terms", "Terms"],
        ["cookies", "Cookies"],
      ].map(([k, t]: any) => ({ t, go: legalGo(k) })),
      footLive: MODS.filter((x: any) => x[3]).map((x: any) => ({
        t: x[0],
        go:
          x[0] === "Tasks" || x[0] === "Docs"
            ? go("module", { modO: x[0].toLowerCase() })
            : go("modules"),
      })),
      footSoon: soon.map((x: any) => x[0]),
      ico: {
        check: ic("check", 16, "var(--ink)"),
        checkInv: ic("check", 12, "var(--bg)"),
        list: ic("list", 14),
        board: ic("board", 14),
        plus: ic("plus", 14),
        search: ic("search", 14),
        docs: ic("docs", 14),
        bell: ic("bell", 16),
        alert: ic("alert", 16, "var(--rose)"),
        chev: ic("chev", 16, "var(--ink2)"),
        arrow: ic("arrowR", 14),
      },
      // pricing
      bill,
      billNote: yr ? "Yearly discount: TBD" : "Prices in USD · placeholder",
      plans,
      incl: [
        "All 7 live modules",
        "One search",
        "Roles & permissions",
        "Audit log",
      ],
      planTabs: PLANS.map((pl: any, i: any) => ({
        l: pl[0],
        st: seg2(s.planM === i),
        go: () => setS({ planM: i }),
      })),
      cmpHead: cols.map((i: any) => PLANS[i]![0]),
      cmpRows: COMPARE.map(([l, sub, v]: any) => ({
        l,
        sub,
        hasSub: !!sub,
        cells: cols.map((i: any) => cell(v[i])),
      })),
      addRows: soon.map((x: any) => ({
        n: x[0],
        code: x[1],
        d: x[4],
        codeSt: codeSt(TINT[x[2]]),
        ...tog(!!s.add[x[0]]),
        click: () =>
          setS((st0: any) => ({ add: { ...st0.add, [x[0]]: !st0.add[x[0]] } })),
      })),
      addSel,
      addNone: addSel.length === 0,
      addCount: `${addSel.length} add-on${addSel.length === 1 ? "" : "s"}`,
      faq: FAQ.map(([q, a], i) => ({
        q,
        a,
        open: s.faq === i,
        click: () => setS({ faq: s.faq === i ? -1 : i }),
        icSt: {
          ...ic("plus", 20, "var(--ink2)"),
          transform: s.faq === i ? "rotate(45deg)" : "none",
          transition: "transform .3s",
        },
      })),
      // modules
      filtSeg: [
        ["all", "All 18"],
        ["live", "Live 7"],
        ["coming", "Coming 11"],
      ].map(([k, l]: any) => ({
        l,
        st: seg2(filt === k),
        go: () => setS({ filt: k }),
      })),
      mgroups,
      // module
      md,
      isTasks: mod !== "docs",
      isDocs: mod === "docs",
      mdLinks,
      lkLine,
      mdPerm: MDx.perms.map(([a, v]: any) => ({
        mod: MDx.n,
        act: a,
        cells: v.map(cellG),
      })),
      roleNames: ["Owner", "Admin", "Member", "Guest"],
      sbNav: sbFor(mod === "docs" ? "docs" : "tasks"),
      tl,
      tdProps,
      tdLinks,
      upNext,
      dh,
      docTasks,
      share,
      tools: ["bold", "italic", "bullets", "checklist", "code", "link"].map(
        (k: any) => ic(k, 16),
      ),
      // roadmap
      rmGroups,
      notifyAll: () =>
        setS({
          notify: Object.fromEntries(soon.map((x: any) => [x[0], !allN])),
        }),
      notifyAllT: allN
        ? "Notifying you about all 11"
        : "Notify me about all 11",
      // security
      secRoles,
      secMatrix,
      chain,
      chainLine,
      audit,
      // changelog
      clChips,
      entries,
      clEmpty: entries.length === 0,
      // legal
      L,
      legalTabs,
      toc,
      secs,
      tocOpen: s.tocOpen,
      toggleToc: () => setS({ tocOpen: !s.tocOpen }),
      tocLabel: `On this page · ${L.secs.length} sections`,
      tocChev: {
        ...ic("chev", 16, "var(--ink2)"),
        transform: s.tocOpen ? "rotate(180deg)" : "none",
      },
      // contact
      fm,
      topics: TOPICS,
      submit,
      sent: s.sent,
      notSent: !s.sent,
      hasErrs: errCount > 0 && s.submitted,
      errSummary: `${errCount === 1 ? "One field needs" : errCount + " fields need"} attention before we can send your message. Each one says what to change.`,
      sentName: f.name.trim().split(" ")[0] || "there",
      sentEmail: f.email,
      resetForm: () =>
        setS({
          sent: false,
          submitted: false,
          touched: {},
          f: { name: "", email: "", topic: "", msg: "" },
        }),
      // status
      inc,
      ok: !inc,
      comps,
      stDot,
      incUpd,
    };
  })();

  return <SiteTemplate v={vals} />;
}
