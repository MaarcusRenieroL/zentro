// Generated from the Zentro site design (Zentro Site Page). Edit the data and logic in
// site-page.tsx; this file is markup only.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, type CSSProperties } from "react";

const hrefOf = (fn: any): string => (fn && fn.href) || "#";

export function SiteTemplate({ v }: { v: any }) {
  const {
    L,
    addCount,
    addNone,
    addRows,
    addSel,
    audit,
    bill,
    billNote,
    chain,
    chainLine,
    cl,
    clChips,
    clEmpty,
    close2,
    closeLead,
    cmpHead,
    cmpRows,
    comps,
    dh,
    docTasks,
    endNode,
    entries,
    errSummary,
    faq,
    fill,
    fillEnd,
    filtSeg,
    fm,
    footCompany,
    footLegal,
    footLive,
    footProduct,
    footSoon,
    go,
    hasErrs,
    ico,
    inc,
    incUpd,
    incl,
    isDocs,
    isTasks,
    legalTabs,
    lineRef,
    lkLine,
    m,
    md,
    mdLinks,
    mdPerm,
    menuIc,
    menuLinks,
    menuOn,
    mgroups,
    navLinks,
    nd,
    notM,
    notSent,
    notifyAll,
    notifyAllT,
    ok,
    pg,
    planTabs,
    plans,
    resetForm,
    rmGroups,
    roleNames,
    rootClass,
    rootRef,
    rootStyle,
    rv,
    sbNav,
    secMatrix,
    secRoles,
    secs,
    sent,
    sentEmail,
    sentName,
    setDark,
    setLight,
    setSys,
    share,
    showClose,
    showFooter,
    showMain,
    showNav,
    stDot,
    submit,
    tdLinks,
    tdProps,
    th,
    thIc,
    tl,
    toc,
    tocChev,
    tocLabel,
    tocOpen,
    toggleMenu,
    toggleToc,
    tools,
    topics,
    track,
    upNext,
  } = v;

  return (
    <div ref={rootRef} className={rootClass} style={rootStyle}>
      {showNav ? (
        <>
          <header
            style={{
              position: "sticky",
              top: "0",
              zIndex: "50",
              height: "64px",
              display: "flex",
              alignItems: "center",
              gap: "24px",
              padding: "0 var(--pr) 0 var(--navPL)",
              background: "var(--nav-bg)",
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid var(--line2)",
            }}
          >
            <a
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "var(--ink)",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "7px",
                  background: "var(--ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    width: "2px",
                    height: "12px",
                    borderRadius: "2px",
                    background: "var(--accent)",
                  }}
                ></span>
              </span>
              <span
                style={{
                  fontFamily:
                    "var(--font-bricolage), var(--font-geist), sans-serif",
                  fontWeight: "700",
                  fontSize: "20px",
                  letterSpacing: "-0.04em",
                }}
              >
                Zentro
              </span>
            </a>
            {notM ? (
              <>
                <nav
                  style={{ display: "flex", gap: "28px", marginLeft: "24px" }}
                >
                  <a
                    href="/"
                    style={{ color: "var(--ink2)", fontSize: "14px" }}
                  >
                    Product
                  </a>
                  {navLinks.map((l: any, i1: number) => (
                    <Fragment key={i1}>
                      <a href={hrefOf(l.go)} onClick={l.go} style={l.st}>
                        {l.t}
                      </a>
                    </Fragment>
                  ))}
                </nav>
              </>
            ) : null}
            <div style={{ flex: "1" }}></div>
            {notM ? (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: "2px",
                    padding: "3px",
                    border: "1px solid var(--line)",
                    borderRadius: "999px",
                  }}
                >
                  <button
                    style={th.light}
                    onClick={setLight}
                    aria-label="Light theme"
                    title="Light"
                  >
                    <span style={thIc.light}></span>
                  </button>
                  <button
                    style={th.dark}
                    onClick={setDark}
                    aria-label="Dark theme"
                    title="Dark"
                  >
                    <span style={thIc.dark}></span>
                  </button>
                  <button
                    style={th.sys}
                    onClick={setSys}
                    aria-label="System theme"
                    title="System"
                  >
                    <span style={thIc.sys}></span>
                  </button>
                </div>
                <a
                  href="/auth/sign-in"
                  style={{
                    color: "var(--ink)",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Sign in
                </a>
              </>
            ) : null}
            <a
              href="/auth/sign-up"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "38px",
                padding: "0 18px",
                borderRadius: "999px",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                fontSize: "14px",
                fontWeight: "500",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Start free
            </a>
            {m ? (
              <>
                <button
                  onClick={toggleMenu}
                  aria-label="Menu"
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "12px",
                    border: "1px solid var(--line)",
                    background: "transparent",
                    color: "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <span style={menuIc}></span>
                </button>
              </>
            ) : null}
          </header>
        </>
      ) : null}
      {menuOn ? (
        <>
          <div
            style={{
              position: "absolute",
              top: "64px",
              left: "0",
              right: "0",
              zIndex: "49",
              minHeight: "780px",
              background: "var(--bg)",
              padding: "8px 20px 32px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {menuLinks.map((l: any, i2: number) => (
              <Fragment key={i2}>
                <a href={hrefOf(l.go)} onClick={l.go} style={l.st}>
                  <span
                    style={{
                      fontFamily:
                        "var(--font-geist-mono), ui-monospace, monospace",
                      fontSize: "11px",
                      color: "var(--ink3)",
                      width: "28px",
                    }}
                  >
                    {l.i}
                  </span>
                  <span style={{ flex: "1" }}>{l.t}</span>
                  <span style={l.ar}></span>
                </a>
              </Fragment>
            ))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 0",
                borderTop: "1px solid var(--line2)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontSize: "11px",
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "var(--ink3)",
                }}
              >
                Theme
              </span>
              <div
                style={{
                  display: "flex",
                  gap: "2px",
                  padding: "3px",
                  border: "1px solid var(--line)",
                  borderRadius: "999px",
                }}
              >
                <button
                  style={th.light}
                  onClick={setLight}
                  aria-label="Light theme"
                  title="Light"
                >
                  <span style={thIc.light}></span>
                </button>
                <button
                  style={th.dark}
                  onClick={setDark}
                  aria-label="Dark theme"
                  title="Dark"
                >
                  <span style={thIc.dark}></span>
                </button>
                <button
                  style={th.sys}
                  onClick={setSys}
                  aria-label="System theme"
                  title="System"
                >
                  <span style={thIc.sys}></span>
                </button>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "8px",
              }}
            >
              <a
                href="/auth/sign-up"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "52px",
                  borderRadius: "999px",
                  background: "var(--btn)",
                  color: "var(--btn-ink)",
                  fontSize: "16px",
                  fontWeight: "500",
                  textDecoration: "none",
                }}
              >
                Start free
              </a>
              <a
                href="/auth/sign-in"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "52px",
                  borderRadius: "999px",
                  border: "1px solid var(--line)",
                  color: "var(--ink)",
                  fontSize: "16px",
                  fontWeight: "500",
                  textDecoration: "none",
                }}
              >
                Sign in
              </a>
            </div>
            <div
              style={{
                display: "flex",
                gap: "20px",
                marginTop: "28px",
                fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                fontSize: "12px",
              }}
            >
              {footLegal.map((l: any, i3: number) => (
                <Fragment key={i3}>
                  <a
                    href={hrefOf(l.go)}
                    onClick={l.go}
                    style={{ color: "var(--ink3)" }}
                  >
                    {l.t}
                  </a>
                </Fragment>
              ))}
            </div>
          </div>
        </>
      ) : null}
      {showMain ? (
        <>
          <main style={{ position: "relative" }}>
            <div
              ref={lineRef}
              style={{
                position: "absolute",
                left: "calc(var(--tx) - 0.75px)",
                top: "calc(var(--heroT) + 8px)",
                bottom: "0",
                width: "1.5px",
              }}
            >
              <div style={track}></div>
              <div style={fill}></div>
            </div>
            {pg.pricing ? (
              <>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--heroT) var(--pr) 0 var(--px)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      bottom: "0",
                      left: "56%",
                      width: "200px",
                      background:
                        "linear-gradient(to bottom, transparent, var(--beam) 45%, transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      top: "-240px",
                      left: "35%",
                      width: "1000px",
                      height: "800px",
                      background:
                        "radial-gradient(closest-side, var(--wash), transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--heroT) + 4px)",
                    }}
                  >
                    <div data-nd="k0" style={nd.k0}></div>
                  </div>
                  <div data-rv="0" style={rv.r0}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "28px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "12px",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "var(--ink3)",
                          }}
                        >
                          Pricing
                        </span>
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            letterSpacing: ".06em",
                            textTransform: "uppercase",
                            color: "var(--amber)",
                            border: "1px dashed var(--amber)",
                            borderRadius: "999px",
                            padding: "2px 9px",
                          }}
                        >
                          Placeholder
                        </span>
                      </div>
                      <h1
                        style={{
                          margin: "0",
                          maxWidth: "1000px",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h1)",
                          lineHeight: "0.98",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        Every plan starts with the seven live{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          modules
                        </em>
                        .
                      </h1>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "32px 64px",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                        }}
                      >
                        <p
                          style={{
                            margin: "0",
                            maxWidth: "560px",
                            fontSize: "var(--lead)",
                            lineHeight: "1.5",
                            color: "var(--ink2)",
                            textWrap: "pretty",
                          }}
                        >
                          Plans differ by limits and support, not by which live
                          modules you get. Plan names, prices and limits on this
                          page are placeholders until pricing is decided.
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <a
                            href="/auth/sign-up"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: "48px",
                              padding: "0 24px",
                              borderRadius: "999px",
                              background: "var(--btn)",
                              color: "var(--btn-ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            Start free
                          </a>
                          <a
                            href="#compare"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: "48px",
                              padding: "0 22px",
                              borderRadius: "999px",
                              border: "1px solid var(--line)",
                              color: "var(--ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            Compare plans
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "96px var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "100px",
                    }}
                  >
                    <div data-nd="k1" style={nd.k1}></div>
                  </div>
                  <div data-rv="1" style={rv.r1}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "16px",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: "20px",
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        01 · Plans
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            color: "var(--ink3)",
                          }}
                        >
                          {billNote}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: "2px",
                            padding: "3px",
                            border: "1px solid var(--line)",
                            borderRadius: "999px",
                          }}
                        >
                          {bill.map((b: any, i4: number) => (
                            <Fragment key={i4}>
                              <button style={b.st} onClick={b.go}>
                                {b.l}
                              </button>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "var(--plCols)",
                      }}
                    >
                      {plans.map((pl: any, i5: number) => (
                        <Fragment key={i5}>
                          <div style={pl.colSt}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily:
                                    "var(--font-bricolage), var(--font-geist), sans-serif",
                                  fontWeight: "700",
                                  fontSize: "28px",
                                  letterSpacing: "-0.03em",
                                }}
                              >
                                {pl.n}
                              </span>
                              <span
                                style={{
                                  fontFamily:
                                    "var(--font-geist-mono), ui-monospace, monospace",
                                  fontSize: "10px",
                                  letterSpacing: ".06em",
                                  textTransform: "uppercase",
                                  color: "var(--amber)",
                                  border: "1px dashed var(--amber)",
                                  borderRadius: "999px",
                                  padding: "1px 8px",
                                }}
                              >
                                Placeholder
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "15px",
                                lineHeight: "1.45",
                                color: "var(--ink2)",
                                minHeight: "44px",
                                textWrap: "pretty",
                              }}
                            >
                              {pl.d}
                            </span>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "6px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "22px",
                                  color: "var(--ink3)",
                                  paddingTop: "10px",
                                }}
                              >
                                $
                              </span>
                              <span
                                style={{
                                  fontFamily:
                                    "var(--font-bricolage), var(--font-geist), sans-serif",
                                  fontWeight: "700",
                                  fontSize: "72px",
                                  lineHeight: "1",
                                  letterSpacing: "-0.04em",
                                  color: "var(--ink3)",
                                  backgroundImage:
                                    "repeating-linear-gradient(135deg, var(--line2) 0 6px, transparent 6px 12px)",
                                  border: "1px dashed var(--line)",
                                  borderRadius: "10px",
                                  padding: "2px 10px",
                                }}
                              >
                                00
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "14px",
                                  color: "var(--ink2)",
                                }}
                              >
                                {pl.per}
                              </span>
                              <span
                                style={{
                                  fontFamily:
                                    "var(--font-geist-mono), ui-monospace, monospace",
                                  fontSize: "11px",
                                  color: "var(--ink3)",
                                }}
                              >
                                {pl.note}
                              </span>
                            </div>
                            <a
                              href="#"
                              style={{
                                alignSelf: "flex-start",
                                display: "inline-flex",
                                alignItems: "center",
                                height: "44px",
                                padding: "0 20px",
                                borderRadius: "999px",
                                border: "1px solid var(--line)",
                                color: "var(--ink)",
                                fontSize: "14px",
                                fontWeight: "500",
                                textDecoration: "none",
                              }}
                            >
                              Choose {pl.n}
                            </a>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px 28px",
                        alignItems: "center",
                        padding: "20px 0",
                        borderTop: "1px solid var(--line2)",
                        borderBottom: "1px solid var(--line2)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "11px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        On every plan
                      </span>
                      {incl.map((x: any, i6: number) => (
                        <Fragment key={i6}>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "14px",
                            }}
                          >
                            <span style={ico.check}></span>
                            {x}
                          </span>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </section>
                <section
                  id="compare"
                  style={{
                    position: "relative",
                    padding: "var(--sec) var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--sec) + 4px)",
                    }}
                  >
                    <div data-nd="k2" style={nd.k2}></div>
                  </div>
                  <div data-rv="2" style={rv.r2}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        maxWidth: "720px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        02 · Compare
                      </span>
                      <h2
                        style={{
                          margin: "0",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h2)",
                          lineHeight: "1",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        What changes between{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          plans
                        </em>
                        .
                      </h2>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "17px",
                          lineHeight: "1.55",
                          color: "var(--ink2)",
                          textWrap: "pretty",
                        }}
                      >
                        Rows marked TBD are not decided. The live modules,
                        search, roles and the audit log are the same on every
                        plan.
                      </p>
                    </div>
                    {m ? (
                      <>
                        <div
                          style={{
                            display: "flex",
                            gap: "2px",
                            padding: "3px",
                            border: "1px solid var(--line)",
                            borderRadius: "999px",
                            alignSelf: "flex-start",
                            width: "max-content",
                            marginTop: "28px",
                          }}
                        >
                          {planTabs.map((b: any, i7: number) => (
                            <Fragment key={i7}>
                              <button style={b.st} onClick={b.go}>
                                {b.l}
                              </button>
                            </Fragment>
                          ))}
                        </div>
                      </>
                    ) : null}
                    <div style={{ marginTop: "40px" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "var(--cmpCols)",
                          alignItems: "end",
                          paddingBottom: "14px",
                          borderBottom: "1px solid var(--line)",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "var(--ink3)",
                          }}
                        >
                          Feature
                        </span>
                        {cmpHead.map((h: any, i8: number) => (
                          <Fragment key={i8}>
                            <span
                              style={{
                                fontSize: "15px",
                                fontWeight: "600",
                                textAlign:
                                  "var(--cmpTA)" as CSSProperties["textAlign"],
                              }}
                            >
                              {h}
                            </span>
                          </Fragment>
                        ))}
                      </div>
                      {cmpRows.map((r: any, i9: number) => (
                        <Fragment key={i9}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "var(--cmpCols)",
                              alignItems: "center",
                              minHeight: "56px",
                              borderBottom: "1px solid var(--line2)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "3px",
                                padding: "12px 16px 12px 0",
                              }}
                            >
                              <span style={{ fontSize: "15px" }}>{r.l}</span>
                              {r.hasSub ? (
                                <>
                                  <span
                                    style={{
                                      fontFamily:
                                        "var(--font-geist-mono), ui-monospace, monospace",
                                      fontSize: "11px",
                                      color: "var(--ink3)",
                                    }}
                                  >
                                    {r.sub}
                                  </span>
                                </>
                              ) : null}
                            </div>
                            {r.cells.map((c: any, i10: number) => (
                              <Fragment key={i10}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "var(--cmpJ)",
                                  }}
                                >
                                  <span style={c.st}>{c.t}</span>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--sec) var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--sec) + 4px)",
                    }}
                  >
                    <div data-nd="k3" style={nd.k3}></div>
                  </div>
                  <div data-rv="3" style={rv.r3}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        maxWidth: "760px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "12px",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "var(--ink3)",
                          }}
                        >
                          03 · Add-ons
                        </span>
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            letterSpacing: ".06em",
                            textTransform: "uppercase",
                            color: "var(--amber)",
                            border: "1px dashed var(--amber)",
                            borderRadius: "999px",
                            padding: "2px 9px",
                          }}
                        >
                          Concept
                        </span>
                      </div>
                      <h2
                        style={{
                          margin: "0",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h2)",
                          lineHeight: "1",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        Add coming modules one at a{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          time
                        </em>
                        .
                      </h2>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "17px",
                          lineHeight: "1.55",
                          color: "var(--ink2)",
                          textWrap: "pretty",
                        }}
                      >
                        The idea: every plan includes the live modules, and each
                        coming module becomes an add-on you can switch on when
                        it ships. Try it below. Prices are placeholders.
                      </p>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "var(--adCols)",
                        gap: "40px 64px",
                        marginTop: "48px",
                        alignItems: "start",
                      }}
                    >
                      <div style={{ borderTop: "1px solid var(--line)" }}>
                        {addRows.map((a: any, i11: number) => (
                          <Fragment key={i11}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "14px",
                                padding: "14px 0",
                                borderBottom: "1px solid var(--line2)",
                              }}
                            >
                              <span style={a.codeSt}>{a.code}</span>
                              <div style={{ flex: "1", minWidth: "0" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "15px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {a.n}
                                  </span>
                                  <span
                                    style={{
                                      fontFamily:
                                        "var(--font-geist-mono), ui-monospace, monospace",
                                      fontSize: "10px",
                                      color: "var(--ink2)",
                                      border: "1px dashed var(--ink3)",
                                      borderRadius: "999px",
                                      padding: "1px 8px",
                                    }}
                                  >
                                    Coming
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: "13px",
                                    lineHeight: "1.4",
                                    color: "var(--ink2)",
                                    marginTop: "3px",
                                  }}
                                >
                                  {a.d}
                                </div>
                              </div>
                              <span
                                style={{
                                  fontFamily:
                                    "var(--font-geist-mono), ui-monospace, monospace",
                                  fontSize: "12px",
                                  color: "var(--ink3)",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                + $00
                              </span>
                              <div style={a.track} onClick={a.click}>
                                <span style={a.knob}></span>
                              </div>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                      <div
                        style={{
                          position: "sticky",
                          top: "96px",
                          backgroundColor: "var(--tile)",
                          backgroundImage: "var(--glass)",
                          border: "1px solid var(--line)",
                          borderRadius: "20px",
                          boxShadow: "var(--shadow)",
                          padding: "24px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "var(--ink3)",
                          }}
                        >
                          Example total
                        </span>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                          }}
                        >
                          <span style={{ fontSize: "15px", fontWeight: "600" }}>
                            [Plan B]
                          </span>
                          <span
                            style={{
                              fontFamily:
                                "var(--font-geist-mono), ui-monospace, monospace",
                              fontSize: "13px",
                              color: "var(--ink3)",
                            }}
                          >
                            $00
                          </span>
                        </div>
                        {addSel.map((x: any, i12: number) => (
                          <Fragment key={i12}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "12px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "14px",
                                  color: "var(--ink2)",
                                }}
                              >
                                + {x}
                              </span>
                              <span
                                style={{
                                  fontFamily:
                                    "var(--font-geist-mono), ui-monospace, monospace",
                                  fontSize: "13px",
                                  color: "var(--ink3)",
                                }}
                              >
                                $00
                              </span>
                            </div>
                          </Fragment>
                        ))}
                        {addNone ? (
                          <>
                            <span
                              style={{ fontSize: "14px", color: "var(--ink3)" }}
                            >
                              No add-ons switched on.
                            </span>
                          </>
                        ) : null}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: "12px",
                            paddingTop: "14px",
                            borderTop: "1px solid var(--line2)",
                          }}
                        >
                          <span style={{ fontSize: "15px", fontWeight: "600" }}>
                            Per person / month
                          </span>
                          <span
                            style={{
                              fontFamily:
                                "var(--font-bricolage), var(--font-geist), sans-serif",
                              fontWeight: "700",
                              fontSize: "30px",
                              letterSpacing: "-0.03em",
                              color: "var(--ink3)",
                            }}
                          >
                            $00
                          </span>
                        </div>
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            color: "var(--amber)",
                          }}
                        >
                          {addCount} · placeholder, not a price
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--sec) var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--sec) + 4px)",
                    }}
                  >
                    <div data-nd="k4" style={nd.k4}></div>
                  </div>
                  <div data-rv="4" style={rv.r4}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "var(--faqCols)",
                        gap: "40px 64px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "12px",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "var(--ink3)",
                          }}
                        >
                          04 · FAQ
                        </span>
                        <h2
                          style={{
                            margin: "0",
                            fontFamily:
                              "var(--font-bricolage), var(--font-geist), sans-serif",
                            fontWeight: "700",
                            fontSize: "var(--h2)",
                            lineHeight: "1",
                            letterSpacing: "-0.04em",
                            textWrap: "balance",
                          }}
                        >
                          Questions about{" "}
                          <em
                            style={{
                              fontFamily: "var(--font-instrument-serif), serif",
                              fontStyle: "italic",
                              fontWeight: "400",
                              fontSize: "1.1em",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            pricing
                          </em>
                          .
                        </h2>
                      </div>
                      <div style={{ borderTop: "1px solid var(--line)" }}>
                        {faq.map((q: any, i13: number) => (
                          <Fragment key={i13}>
                            <div
                              style={{ borderBottom: "1px solid var(--line2)" }}
                            >
                              <button
                                onClick={q.click}
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "16px",
                                  padding: "22px 0",
                                  background: "none",
                                  border: "none",
                                  color: "var(--ink)",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  fontSize: "18px",
                                  fontWeight: "500",
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                <span style={{ flex: "1" }}>{q.q}</span>
                                <span style={q.icSt}></span>
                              </button>
                              {q.open ? (
                                <>
                                  <p
                                    style={{
                                      margin: "0 0 24px",
                                      maxWidth: "620px",
                                      fontSize: "16px",
                                      lineHeight: "1.6",
                                      color: "var(--ink2)",
                                      textWrap: "pretty",
                                    }}
                                  >
                                    {q.a}
                                  </p>
                                </>
                              ) : null}
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            {pg.modules ? (
              <>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--heroT) var(--pr) 0 var(--px)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      bottom: "0",
                      left: "44%",
                      width: "200px",
                      background:
                        "linear-gradient(to bottom, transparent, var(--beam) 45%, transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      bottom: "0",
                      left: "78%",
                      width: "140px",
                      background:
                        "linear-gradient(to bottom, var(--beam), transparent 80%)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      top: "-240px",
                      left: "35%",
                      width: "1000px",
                      height: "800px",
                      background:
                        "radial-gradient(closest-side, var(--wash), transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--heroT) + 4px)",
                    }}
                  >
                    <div data-nd="k0" style={nd.k0}></div>
                  </div>
                  <div data-rv="0" style={rv.r0}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "28px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        Modules · 7 live · 11 coming
                      </span>
                      <h1
                        style={{
                          margin: "0",
                          maxWidth: "1000px",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h1)",
                          lineHeight: "0.98",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        Eighteen modules, one{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          workspace
                        </em>
                        .
                      </h1>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "32px 64px",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                        }}
                      >
                        <p
                          style={{
                            margin: "0",
                            maxWidth: "560px",
                            fontSize: "var(--lead)",
                            lineHeight: "1.5",
                            color: "var(--ink2)",
                            textWrap: "pretty",
                          }}
                        >
                          Every module shares the same people, roles, search and
                          audit log. Turn on the live ones today. The rest join
                          the same workspace as they ship.
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <a
                            href="/auth/sign-up"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: "48px",
                              padding: "0 24px",
                              borderRadius: "999px",
                              background: "var(--btn)",
                              color: "var(--btn-ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            Start free
                          </a>
                          <a
                            href={hrefOf(go.roadmap)}
                            onClick={go.roadmap}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: "48px",
                              padding: "0 22px",
                              borderRadius: "999px",
                              border: "1px solid var(--line)",
                              color: "var(--ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            See the roadmap
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "96px var(--pr) 0 var(--px)",
                  }}
                >
                  <div data-rv="1" style={rv.r1}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "16px",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: "20px",
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "2px",
                          padding: "3px",
                          border: "1px solid var(--line)",
                          borderRadius: "999px",
                        }}
                      >
                        {filtSeg.map((b: any, i14: number) => (
                          <Fragment key={i14}>
                            <button style={b.st} onClick={b.go}>
                              {b.l}
                            </button>
                          </Fragment>
                        ))}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "16px",
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          color: "var(--ink2)",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "99px",
                              background: "var(--green)",
                            }}
                          ></span>
                          Live today
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            color: "var(--ink3)",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "99px",
                              border: "1px solid var(--ink3)",
                            }}
                          ></span>
                          Coming, no date yet
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "72px",
                      marginTop: "64px",
                    }}
                  >
                    {mgroups.map((g: any, i15: number) => (
                      <Fragment key={i15}>
                        {g.show ? (
                          <>
                            <div data-rv={g.rvk} style={g.rv}>
                              <div
                                style={{
                                  position: "relative",
                                  display: "grid",
                                  gridTemplateColumns: "var(--gCols)",
                                  gap: "20px 32px",
                                }}
                              >
                                <div style={g.br}></div>
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "34px",
                                    left: "calc(var(--tx) - var(--px) - 4.5px)",
                                  }}
                                >
                                  <div data-nd={g.k} style={g.nd}></div>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontFamily:
                                        "var(--font-geist-mono), ui-monospace, monospace",
                                      fontSize: "11px",
                                      letterSpacing: ".06em",
                                      color: "var(--ink3)",
                                    }}
                                  >
                                    {g.idx}
                                  </span>
                                  <span
                                    style={{
                                      fontFamily:
                                        "var(--font-bricolage), var(--font-geist), sans-serif",
                                      fontWeight: "700",
                                      fontSize: "28px",
                                      letterSpacing: "-0.03em",
                                    }}
                                  >
                                    {g.name}
                                  </span>
                                  <span
                                    style={{
                                      fontFamily:
                                        "var(--font-geist-mono), ui-monospace, monospace",
                                      fontSize: "12px",
                                      color: "var(--ink3)",
                                    }}
                                  >
                                    {g.meta}
                                  </span>
                                </div>
                                <div
                                  style={{ borderTop: "1px solid var(--line)" }}
                                >
                                  {g.rows.map((r: any, i16: number) => (
                                    <Fragment key={i16}>
                                      <div style={r.rowSt}>
                                        <span style={r.codeSt}>{r.code}</span>
                                        <div
                                          style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "4px 24px",
                                            alignItems: "baseline",
                                            minWidth: "0",
                                          }}
                                        >
                                          <span
                                            style={{
                                              width: "var(--mnW)",
                                              fontSize: "17px",
                                              fontWeight: "600",
                                              letterSpacing: "-0.01em",
                                            }}
                                          >
                                            {r.n}
                                          </span>
                                          <span
                                            style={{
                                              flex: "1 1 260px",
                                              fontSize: "15px",
                                              lineHeight: "1.45",
                                              color: "var(--ink2)",
                                              textWrap: "pretty",
                                            }}
                                          >
                                            {r.d}
                                          </span>
                                        </div>
                                        <span style={r.chipSt}>{r.chipT}</span>
                                        <a
                                          href={hrefOf(r.go)}
                                          onClick={r.go}
                                          style={r.linkSt}
                                        >
                                          {r.linkT}
                                          <span style={r.ar}></span>
                                        </a>
                                      </div>
                                    </Fragment>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </Fragment>
                    ))}
                  </div>
                  <p
                    style={{
                      margin: "56px 0 0",
                      maxWidth: "760px",
                      fontSize: "16px",
                      lineHeight: "1.55",
                      color: "var(--ink3)",
                      paddingLeft: "var(--repPL)",
                      textWrap: "pretty",
                    }}
                  >
                    Pages for the other live modules use the same template as
                    Tasks and Docs.
                  </p>
                </section>
              </>
            ) : null}
            {pg.module ? (
              <>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--heroT) var(--pr) 0 var(--px)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      bottom: "0",
                      left: "60%",
                      width: "200px",
                      background:
                        "linear-gradient(to bottom, transparent, var(--beam) 45%, transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      top: "-240px",
                      left: "35%",
                      width: "1000px",
                      height: "800px",
                      background:
                        "radial-gradient(closest-side, var(--wash), transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--heroT) + 4px)",
                    }}
                  >
                    <div data-nd="k0" style={nd.k0}></div>
                  </div>
                  <div data-rv="0" style={rv.r0}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "28px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        <a
                          href={hrefOf(go.modules)}
                          onClick={go.modules}
                          style={{ color: "var(--ink2)" }}
                        >
                          Modules
                        </a>
                        <span>/</span>
                        <span>{md.group}</span>
                        <span>/</span>
                        <span style={{ color: "var(--ink)" }}>{md.n}</span>
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            letterSpacing: "0",
                            textTransform: "none",
                            color: "var(--green)",
                            marginLeft: "6px",
                          }}
                        >
                          ● Live
                        </span>
                      </div>
                      <h1
                        style={{
                          margin: "0",
                          maxWidth: "1040px",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h1)",
                          lineHeight: "0.98",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        {md.h1a}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {md.h1em}
                        </em>
                        {md.h1b}
                      </h1>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "32px 64px",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                        }}
                      >
                        <p
                          style={{
                            margin: "0",
                            maxWidth: "580px",
                            fontSize: "var(--lead)",
                            lineHeight: "1.5",
                            color: "var(--ink2)",
                            textWrap: "pretty",
                          }}
                        >
                          {md.lead}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <a
                            href="/auth/sign-up"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: "48px",
                              padding: "0 24px",
                              borderRadius: "999px",
                              background: "var(--btn)",
                              color: "var(--btn-ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            Start free
                          </a>
                          <a
                            href={hrefOf(go.modules)}
                            onClick={go.modules}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: "48px",
                              padding: "0 22px",
                              borderRadius: "999px",
                              border: "1px solid var(--line)",
                              color: "var(--ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            All modules
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--sec) var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--sec) + 4px)",
                    }}
                  >
                    <div data-nd="k1" style={nd.k1}></div>
                  </div>
                  <div data-rv="1" style={rv.r1}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        maxWidth: "720px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        01 · In the product
                      </span>
                      <h2
                        style={{
                          margin: "0",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h2)",
                          lineHeight: "1",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        Three screens from the{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          app
                        </em>
                        .
                      </h2>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "48px",
                        marginTop: "56px",
                      }}
                    >
                      <figure style={{ margin: "0" }}>
                        <div
                          style={{
                            position: "relative",
                            borderRadius: "20px",
                            border: "1px solid var(--line)",
                            background: "var(--frame)",
                            boxShadow: "var(--shadow)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "40px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "0 16px",
                              borderBottom: "1px solid var(--line2)",
                            }}
                          >
                            <span
                              style={{
                                width: "9px",
                                height: "9px",
                                borderRadius: "99px",
                                background: "var(--line)",
                              }}
                            ></span>
                            <span
                              style={{
                                width: "9px",
                                height: "9px",
                                borderRadius: "99px",
                                background: "var(--line)",
                              }}
                            ></span>
                            <span
                              style={{
                                width: "9px",
                                height: "9px",
                                borderRadius: "99px",
                                background: "var(--line)",
                              }}
                            ></span>
                            <span
                              style={{
                                flex: "1",
                                textAlign: "center",
                                fontFamily:
                                  "var(--font-geist-mono), ui-monospace, monospace",
                                fontSize: "12px",
                                color: "var(--ink3)",
                              }}
                            >
                              {md.url1}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "var(--shotCols)",
                              minHeight: "var(--shotH)",
                            }}
                          >
                            <div
                              style={{
                                display: "var(--sbD)",
                                borderRight: "1px solid var(--line2)",
                                padding: "16px 12px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  padding: "0 8px 16px",
                                }}
                              >
                                <span
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "7px",
                                    background: "var(--peach)",
                                    border: "1px solid var(--line)",
                                    fontFamily:
                                      "var(--font-geist-mono), ui-monospace, monospace",
                                    fontSize: "11px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  N
                                </span>
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                  }}
                                >
                                  Northwind Labs
                                </span>
                              </div>
                              {sbNav.map((i: any, i17: number) => (
                                <Fragment key={i17}>
                                  <div style={i.st}>
                                    <span style={i.ic}></span>
                                    <span style={{ flex: "1" }}>{i.l}</span>
                                    <span
                                      style={{
                                        fontFamily:
                                          "var(--font-geist-mono), ui-monospace, monospace",
                                        fontSize: "11px",
                                        color: "var(--ink3)",
                                      }}
                                    >
                                      {i.b}
                                    </span>
                                  </div>
                                </Fragment>
                              ))}
                            </div>
                            <div
                              style={{
                                padding: "22px var(--shotP)",
                                minWidth: "0",
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                              }}
                            >
                              {isTasks ? (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "12px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontFamily:
                                          "var(--font-bricolage), var(--font-geist), sans-serif",
                                        fontWeight: "700",
                                        fontSize: "26px",
                                        letterSpacing: "-0.03em",
                                      }}
                                    >
                                      Tasks
                                    </span>
                                    <span
                                      style={{
                                        fontFamily:
                                          "var(--font-geist-mono), ui-monospace, monospace",
                                        fontSize: "11px",
                                        color: "var(--ink3)",
                                      }}
                                    >
                                      12 open
                                    </span>
                                    <div style={{ flex: "1" }}></div>
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "2px",
                                        padding: "2px",
                                        border: "1px solid var(--line)",
                                        borderRadius: "10px",
                                        fontSize: "12px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          height: "26px",
                                          padding: "0 10px",
                                          borderRadius: "8px",
                                          background: "var(--tile2)",
                                        }}
                                      >
                                        <span style={ico.list}></span>List
                                      </span>
                                      <span
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          height: "26px",
                                          padding: "0 10px",
                                          color: "var(--ink2)",
                                        }}
                                      >
                                        <span style={ico.board}></span>Board
                                      </span>
                                    </div>
                                    <span
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        height: "30px",
                                        padding: "0 12px",
                                        borderRadius: "10px",
                                        border: "1px solid var(--line)",
                                        fontSize: "12px",
                                      }}
                                    >
                                      <span style={ico.plus}></span>New task
                                    </span>
                                  </div>
                                  {tl.map((g: any, i18: number) => (
                                    <Fragment key={i18}>
                                      <div>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "8px 0",
                                            fontFamily:
                                              "var(--font-geist-mono), ui-monospace, monospace",
                                            fontSize: "11px",
                                            letterSpacing: ".06em",
                                            textTransform: "uppercase",
                                            color: "var(--ink3)",
                                          }}
                                        >
                                          <span style={g.g}></span>
                                          {g.label}
                                          <span>{g.count}</span>
                                        </div>
                                        {g.rows.map((r: any, i19: number) => (
                                          <Fragment key={i19}>
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                height: "44px",
                                                borderTop:
                                                  "1px solid var(--line2)",
                                                fontSize: "14px",
                                              }}
                                            >
                                              <span style={r.g}></span>
                                              <span
                                                style={{
                                                  fontFamily:
                                                    "var(--font-geist-mono), ui-monospace, monospace",
                                                  fontSize: "12px",
                                                  color: "var(--ink3)",
                                                  width: "52px",
                                                  flex: "none",
                                                }}
                                              >
                                                {r.k}
                                              </span>
                                              <span
                                                style={{
                                                  flex: "1",
                                                  minWidth: "0",
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                }}
                                              >
                                                {r.t}
                                              </span>
                                              <span
                                                style={{
                                                  display: "var(--sbD)",
                                                  fontSize: "12px",
                                                  color: "var(--ink2)",
                                                  border:
                                                    "1px solid var(--line)",
                                                  borderRadius: "6px",
                                                  padding: "1px 7px",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {r.proj}
                                              </span>
                                              <span style={r.av}>{r.a}</span>
                                              <span style={r.dueSt}>
                                                {r.due}
                                              </span>
                                            </div>
                                          </Fragment>
                                        ))}
                                      </div>
                                    </Fragment>
                                  ))}
                                </>
                              ) : null}
                              {isDocs ? (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "12px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontFamily:
                                          "var(--font-bricolage), var(--font-geist), sans-serif",
                                        fontWeight: "700",
                                        fontSize: "26px",
                                        letterSpacing: "-0.03em",
                                      }}
                                    >
                                      Docs
                                    </span>
                                    <span
                                      style={{
                                        fontFamily:
                                          "var(--font-geist-mono), ui-monospace, monospace",
                                        fontSize: "11px",
                                        color: "var(--ink3)",
                                      }}
                                    >
                                      5 docs
                                    </span>
                                    <div style={{ flex: "1" }}></div>
                                    <span
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        height: "30px",
                                        padding: "0 12px",
                                        borderRadius: "10px",
                                        border: "1px solid var(--line)",
                                        fontSize: "12px",
                                        color: "var(--ink3)",
                                      }}
                                    >
                                      <span style={ico.search}></span>Search
                                      docs
                                    </span>
                                    <span
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        height: "30px",
                                        padding: "0 12px",
                                        borderRadius: "10px",
                                        border: "1px solid var(--line)",
                                        fontSize: "12px",
                                      }}
                                    >
                                      <span style={ico.plus}></span>New doc
                                    </span>
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "var(--dhCols)",
                                        gap: "12px",
                                        padding: "8px 0",
                                        fontFamily:
                                          "var(--font-geist-mono), ui-monospace, monospace",
                                        fontSize: "11px",
                                        letterSpacing: ".06em",
                                        textTransform: "uppercase",
                                        color: "var(--ink3)",
                                      }}
                                    >
                                      <span>Title</span>
                                      <span style={{ display: "var(--sbD)" }}>
                                        Project
                                      </span>
                                      <span style={{ display: "var(--sbD)" }}>
                                        Linked
                                      </span>
                                      <span>Updated</span>
                                    </div>
                                    {dh.map((d: any, i20: number) => (
                                      <Fragment key={i20}>
                                        <div
                                          style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                              "var(--dhCols)",
                                            gap: "12px",
                                            alignItems: "center",
                                            minHeight: "48px",
                                            borderTop: "1px solid var(--line2)",
                                            fontSize: "14px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "10px",
                                              minWidth: "0",
                                            }}
                                          >
                                            <span style={d.ic}>
                                              <span style={ico.docs}></span>
                                            </span>
                                            <span
                                              style={{
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                              }}
                                            >
                                              {d.t}
                                            </span>
                                          </span>
                                          <span
                                            style={{
                                              display: "var(--sbD)",
                                              fontSize: "13px",
                                              color: "var(--ink2)",
                                            }}
                                          >
                                            {d.p}
                                          </span>
                                          <span
                                            style={{
                                              display: "var(--sbD)",
                                              fontFamily:
                                                "var(--font-geist-mono), ui-monospace, monospace",
                                              fontSize: "12px",
                                              color: "var(--ink2)",
                                            }}
                                          >
                                            {d.l}
                                          </span>
                                          <span
                                            style={{
                                              fontFamily:
                                                "var(--font-geist-mono), ui-monospace, monospace",
                                              fontSize: "12px",
                                              color: "var(--ink3)",
                                            }}
                                          >
                                            {d.u}
                                          </span>
                                        </div>
                                      </Fragment>
                                    ))}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <figcaption
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px 16px",
                            alignItems: "baseline",
                            marginTop: "16px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily:
                                "var(--font-geist-mono), ui-monospace, monospace",
                              fontSize: "11px",
                              color: "var(--accent)",
                            }}
                          >
                            FIG 1
                          </span>
                          <span style={{ fontSize: "15px", fontWeight: "600" }}>
                            {md.s1t}
                          </span>
                          <span
                            style={{ fontSize: "14px", color: "var(--ink2)" }}
                          >
                            {md.s1d}
                          </span>
                        </figcaption>
                      </figure>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "var(--two)",
                          gap: "48px 32px",
                          alignItems: "start",
                        }}
                      >
                        <figure style={{ margin: "0" }}>
                          <div
                            style={{
                              borderRadius: "20px",
                              border: "1px solid var(--line)",
                              background: "var(--frame)",
                              boxShadow: "var(--shadow)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "40px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "0 16px",
                                borderBottom: "1px solid var(--line2)",
                              }}
                            >
                              <span
                                style={{
                                  width: "9px",
                                  height: "9px",
                                  borderRadius: "99px",
                                  background: "var(--line)",
                                }}
                              ></span>
                              <span
                                style={{
                                  width: "9px",
                                  height: "9px",
                                  borderRadius: "99px",
                                  background: "var(--line)",
                                }}
                              ></span>
                              <span
                                style={{
                                  width: "9px",
                                  height: "9px",
                                  borderRadius: "99px",
                                  background: "var(--line)",
                                }}
                              ></span>
                              <span
                                style={{
                                  flex: "1",
                                  textAlign: "center",
                                  fontFamily:
                                    "var(--font-geist-mono), ui-monospace, monospace",
                                  fontSize: "12px",
                                  color: "var(--ink3)",
                                }}
                              >
                                {md.url2}
                              </span>
                            </div>
                            <div
                              style={{
                                padding: "22px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "18px",
                                minHeight: "520px",
                              }}
                            >
                              {isTasks ? (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      fontSize: "12px",
                                      color: "var(--ink3)",
                                    }}
                                  >
                                    <span>Zentro Web</span>
                                    <span>/</span>
                                    <span>Tasks</span>
                                    <span>/</span>
                                    <span
                                      style={{
                                        fontFamily:
                                          "var(--font-geist-mono), ui-monospace, monospace",
                                        color: "var(--ink)",
                                      }}
                                    >
                                      ZEN-18
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "22px",
                                      fontWeight: "600",
                                      letterSpacing: "-0.01em",
                                      lineHeight: "1.25",
                                    }}
                                  >
                                    Fix login redirect loop on expired sessions
                                  </div>
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns:
                                        "repeat(2,minmax(0,1fr))",
                                      gap: "14px 16px",
                                      padding: "14px 0",
                                      borderTop: "1px solid var(--line2)",
                                      borderBottom: "1px solid var(--line2)",
                                    }}
                                  >
                                    {tdProps.map((x: any, i21: number) => (
                                      <Fragment key={i21}>
                                        <div>
                                          <div
                                            style={{
                                              fontFamily:
                                                "var(--font-geist-mono), ui-monospace, monospace",
                                              fontSize: "10px",
                                              letterSpacing: ".06em",
                                              textTransform: "uppercase",
                                              color: "var(--ink3)",
                                            }}
                                          >
                                            {x.k}
                                          </div>
                                          <div style={x.st}>{x.v}</div>
                                        </div>
                                      </Fragment>
                                    ))}
                                  </div>
                                  <span
                                    style={{
                                      fontFamily:
                                        "var(--font-geist-mono), ui-monospace, monospace",
                                      fontSize: "11px",
                                      letterSpacing: ".06em",
                                      textTransform: "uppercase",
                                      color: "var(--ink3)",
                                    }}
                                  >
                                    Linked
                                  </span>
                                  <div
                                    style={{
                                      position: "relative",
                                      paddingLeft: "24px",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "2px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        position: "absolute",
                                        left: "4px",
                                        top: "18px",
                                        bottom: "18px",
                                        width: "1.5px",
                                        background: "var(--accent)",
                                        boxShadow: "var(--glow)",
                                      }}
                                    ></div>
                                    {tdLinks.map((l: any, i22: number) => (
                                      <Fragment key={i22}>
                                        <div
                                          style={{
                                            position: "relative",
                                            padding: "8px 12px",
                                            borderRadius: "12px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              position: "absolute",
                                              left: "-24px",
                                              top: "15px",
                                              width: "9px",
                                              height: "9px",
                                              borderRadius: "99px",
                                              background: "var(--accent)",
                                            }}
                                          ></span>
                                          <div
                                            style={{
                                              fontFamily:
                                                "var(--font-geist-mono), ui-monospace, monospace",
                                              fontSize: "10px",
                                              letterSpacing: ".06em",
                                              textTransform: "uppercase",
                                              color: "var(--ink3)",
                                            }}
                                          >
                                            {l.k}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: "14px",
                                              fontWeight: "500",
                                              marginTop: "2px",
                                            }}
                                          >
                                            {l.t}
                                          </div>
                                          <div
                                            style={{
                                              fontFamily:
                                                "var(--font-geist-mono), ui-monospace, monospace",
                                              fontSize: "11px",
                                              color: "var(--ink3)",
                                              marginTop: "2px",
                                            }}
                                          >
                                            {l.s}
                                          </div>
                                        </div>
                                      </Fragment>
                                    ))}
                                  </div>
                                </>
                              ) : null}
                              {isDocs ? (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      paddingBottom: "12px",
                                      borderBottom: "1px solid var(--line2)",
                                    }}
                                  >
                                    {tools.map((t: any, i23: number) => (
                                      <Fragment key={i23}>
                                        <span
                                          style={{
                                            width: "30px",
                                            height: "30px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: "8px",
                                            color: "var(--ink2)",
                                          }}
                                        >
                                          <span style={t}></span>
                                        </span>
                                      </Fragment>
                                    ))}
                                    <div style={{ flex: "1" }}></div>
                                    <span
                                      style={{
                                        fontFamily:
                                          "var(--font-geist-mono), ui-monospace, monospace",
                                        fontSize: "11px",
                                        color: "var(--ink3)",
                                      }}
                                    >
                                      Saved
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontFamily:
                                        "var(--font-bricolage), var(--font-geist), sans-serif",
                                      fontWeight: "700",
                                      fontSize: "28px",
                                      letterSpacing: "-0.03em",
                                      lineHeight: "1.05",
                                    }}
                                  >
                                    Session handling spec
                                  </div>
                                  <div
                                    style={{
                                      fontFamily:
                                        "var(--font-geist-mono), ui-monospace, monospace",
                                      fontSize: "11px",
                                      color: "var(--ink3)",
                                    }}
                                  >
                                    Zentro Web · edited 1h ago by Priya Raman
                                  </div>
                                  <p
                                    style={{
                                      margin: "0",
                                      fontSize: "14px",
                                      lineHeight: "1.6",
                                      color: "var(--ink2)",
                                    }}
                                  >
                                    When a session expires, the app sends the
                                    user to sign in once and returns them to the
                                    page they were on. Refresh tokens rotate on
                                    every use.
                                  </p>
                                  <div
                                    style={{
                                      fontSize: "16px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    Token rotation
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "8px",
                                      fontSize: "14px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: "16px",
                                          height: "16px",
                                          borderRadius: "5px",
                                          background: "var(--ink)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <span style={ico.checkInv}></span>
                                      </span>
                                      <span
                                        style={{
                                          color: "var(--ink2)",
                                          textDecoration: "line-through",
                                        }}
                                      >
                                        Rotate refresh token on use
                                      </span>
                                    </span>
                                    <span
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: "16px",
                                          height: "16px",
                                          borderRadius: "5px",
                                          border: "1.5px solid var(--ink3)",
                                        }}
                                      ></span>
                                      Stop the redirect loop when both tokens
                                      expire
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      marginTop: "auto",
                                      paddingTop: "14px",
                                      borderTop: "1px solid var(--line2)",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "8px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontFamily:
                                          "var(--font-geist-mono), ui-monospace, monospace",
                                        fontSize: "11px",
                                        letterSpacing: ".06em",
                                        textTransform: "uppercase",
                                        color: "var(--ink3)",
                                      }}
                                    >
                                      Linked tasks
                                    </span>
                                    {docTasks.map((r: any, i24: number) => (
                                      <Fragment key={i24}>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            fontSize: "14px",
                                          }}
                                        >
                                          <span style={r.g}></span>
                                          <span
                                            style={{
                                              fontFamily:
                                                "var(--font-geist-mono), ui-monospace, monospace",
                                              fontSize: "12px",
                                              color: "var(--ink3)",
                                            }}
                                          >
                                            {r.k}
                                          </span>
                                          <span
                                            style={{
                                              flex: "1",
                                              minWidth: "0",
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}
                                          >
                                            {r.t}
                                          </span>
                                        </div>
                                      </Fragment>
                                    ))}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </div>
                          <figcaption
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "6px 16px",
                              alignItems: "baseline",
                              marginTop: "16px",
                            }}
                          >
                            <span
                              style={{
                                fontFamily:
                                  "var(--font-geist-mono), ui-monospace, monospace",
                                fontSize: "11px",
                                color: "var(--accent)",
                              }}
                            >
                              FIG 2
                            </span>
                            <span
                              style={{ fontSize: "15px", fontWeight: "600" }}
                            >
                              {md.s2t}
                            </span>
                            <span
                              style={{ fontSize: "14px", color: "var(--ink2)" }}
                            >
                              {md.s2d}
                            </span>
                          </figcaption>
                        </figure>
                        <figure style={{ margin: "0" }}>
                          <div
                            style={{
                              borderRadius: "20px",
                              border: "1px solid var(--line)",
                              background: "var(--frame)",
                              boxShadow: "var(--shadow)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "40px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "0 16px",
                                borderBottom: "1px solid var(--line2)",
                              }}
                            >
                              <span
                                style={{
                                  width: "9px",
                                  height: "9px",
                                  borderRadius: "99px",
                                  background: "var(--line)",
                                }}
                              ></span>
                              <span
                                style={{
                                  width: "9px",
                                  height: "9px",
                                  borderRadius: "99px",
                                  background: "var(--line)",
                                }}
                              ></span>
                              <span
                                style={{
                                  width: "9px",
                                  height: "9px",
                                  borderRadius: "99px",
                                  background: "var(--line)",
                                }}
                              ></span>
                              <span
                                style={{
                                  flex: "1",
                                  textAlign: "center",
                                  fontFamily:
                                    "var(--font-geist-mono), ui-monospace, monospace",
                                  fontSize: "12px",
                                  color: "var(--ink3)",
                                }}
                              >
                                {md.url3}
                              </span>
                            </div>
                            <div
                              style={{
                                padding: "22px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "18px",
                                minHeight: "520px",
                              }}
                            >
                              {isTasks ? (
                                <>
                                  <div>
                                    <div
                                      style={{
                                        fontFamily:
                                          "var(--font-geist-mono), ui-monospace, monospace",
                                        fontSize: "11px",
                                        letterSpacing: ".06em",
                                        color: "var(--ink3)",
                                      }}
                                    >
                                      WED 14 OCT · 2 OVERDUE · 1 DUE TODAY
                                    </div>
                                    <div
                                      style={{
                                        fontFamily:
                                          "var(--font-bricolage), var(--font-geist), sans-serif",
                                        fontWeight: "700",
                                        fontSize: "26px",
                                        letterSpacing: "-0.03em",
                                        marginTop: "6px",
                                      }}
                                    >
                                      Good morning, Priya
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      border: "1px solid var(--line)",
                                      borderRadius: "18px",
                                      background: "var(--tile)",
                                      padding: "20px",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "16px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontFamily:
                                            "var(--font-geist-mono), ui-monospace, monospace",
                                          fontSize: "11px",
                                          letterSpacing: ".06em",
                                          color: "var(--ink3)",
                                        }}
                                      >
                                        FOCUS · ZEN-18
                                      </span>
                                      <span
                                        style={{
                                          fontFamily:
                                            "var(--font-geist-mono), ui-monospace, monospace",
                                          fontSize: "11px",
                                          padding: "3px 9px",
                                          borderRadius: "999px",
                                          color: "var(--amber)",
                                          background:
                                            "color-mix(in oklab, var(--amber) 15%, transparent)",
                                        }}
                                      >
                                        In progress
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "18px",
                                        fontWeight: "600",
                                        lineHeight: "1.3",
                                      }}
                                    >
                                      Fix login redirect loop on expired
                                      sessions
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "flex-end",
                                        justifyContent: "space-between",
                                        gap: "12px",
                                      }}
                                    >
                                      <div>
                                        <div
                                          style={{
                                            fontFamily:
                                              "var(--font-geist-mono), ui-monospace, monospace",
                                            fontSize: "40px",
                                            letterSpacing: "-0.03em",
                                            lineHeight: "1",
                                          }}
                                        >
                                          01:12:40
                                        </div>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            marginTop: "8px",
                                            fontFamily:
                                              "var(--font-geist-mono), ui-monospace, monospace",
                                            fontSize: "11px",
                                            color: "var(--amber)",
                                          }}
                                        >
                                          <span
                                            style={{
                                              width: "6px",
                                              height: "6px",
                                              borderRadius: "99px",
                                              background: "var(--amber)",
                                            }}
                                          ></span>
                                          Running since 09:02
                                        </div>
                                      </div>
                                      <span
                                        style={{
                                          height: "34px",
                                          padding: "0 14px",
                                          borderRadius: "999px",
                                          border: "1px solid var(--line)",
                                          fontSize: "13px",
                                          display: "inline-flex",
                                          alignItems: "center",
                                        }}
                                      >
                                        Pause
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontFamily:
                                          "var(--font-geist-mono), ui-monospace, monospace",
                                        fontSize: "11px",
                                        letterSpacing: ".06em",
                                        color: "var(--ink3)",
                                        paddingBottom: "8px",
                                      }}
                                    >
                                      UP NEXT
                                    </div>
                                    {upNext.map((r: any, i25: number) => (
                                      <Fragment key={i25}>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            height: "44px",
                                            borderTop: "1px solid var(--line2)",
                                            fontSize: "13px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontFamily:
                                                "var(--font-geist-mono), ui-monospace, monospace",
                                              fontSize: "12px",
                                              color: "var(--ink3)",
                                            }}
                                          >
                                            {r.k}
                                          </span>
                                          <span
                                            style={{
                                              flex: "1",
                                              minWidth: "0",
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}
                                          >
                                            {r.t}
                                          </span>
                                          <span style={r.st}>{r.s}</span>
                                        </div>
                                      </Fragment>
                                    ))}
                                  </div>
                                </>
                              ) : null}
                              {isDocs ? (
                                <>
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "18px",
                                        fontWeight: "600",
                                      }}
                                    >
                                      Share “Session handling spec”
                                    </div>
                                    <div
                                      style={{
                                        fontFamily:
                                          "var(--font-geist-mono), ui-monospace, monospace",
                                        fontSize: "11px",
                                        color: "var(--ink3)",
                                        marginTop: "4px",
                                      }}
                                    >
                                      Access follows Zentro Web unless you add
                                      people here
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      height: "40px",
                                      borderRadius: "12px",
                                      border: "1px solid var(--line)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      padding: "0 12px",
                                      fontSize: "13px",
                                      color: "var(--ink3)",
                                    }}
                                  >
                                    <span style={ico.search}></span>Add people
                                    or teams
                                  </div>
                                  <div>
                                    {share.map((r: any, i26: number) => (
                                      <Fragment key={i26}>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            minHeight: "52px",
                                            borderTop: "1px solid var(--line2)",
                                          }}
                                        >
                                          <span style={r.av}>{r.i}</span>
                                          <div
                                            style={{ flex: "1", minWidth: "0" }}
                                          >
                                            <div
                                              style={{
                                                fontSize: "14px",
                                                fontWeight: "500",
                                              }}
                                            >
                                              {r.n}
                                            </div>
                                            <div
                                              style={{
                                                fontFamily:
                                                  "var(--font-geist-mono), ui-monospace, monospace",
                                                fontSize: "11px",
                                                color: "var(--ink3)",
                                              }}
                                            >
                                              {r.s}
                                            </div>
                                          </div>
                                          <span
                                            style={{
                                              fontSize: "12px",
                                              color: "var(--ink2)",
                                              border: "1px solid var(--line)",
                                              borderRadius: "8px",
                                              padding: "3px 9px",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {r.r}
                                          </span>
                                        </div>
                                      </Fragment>
                                    ))}
                                  </div>
                                  <div
                                    style={{
                                      marginTop: "auto",
                                      padding: "14px",
                                      borderRadius: "14px",
                                      border: "1px dashed var(--line)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "12px",
                                    }}
                                  >
                                    <div style={{ flex: "1" }}>
                                      <div
                                        style={{
                                          fontSize: "14px",
                                          fontWeight: "500",
                                        }}
                                      >
                                        Share outside Northwind Labs
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          color: "var(--ink3)",
                                          marginTop: "2px",
                                        }}
                                      >
                                        Only Owners and Admins can turn this on.
                                      </div>
                                    </div>
                                    <span
                                      style={{
                                        width: "36px",
                                        height: "20px",
                                        borderRadius: "99px",
                                        background: "var(--line)",
                                        position: "relative",
                                        opacity: ".6",
                                      }}
                                    >
                                      <span
                                        style={{
                                          position: "absolute",
                                          top: "2px",
                                          left: "2px",
                                          width: "16px",
                                          height: "16px",
                                          borderRadius: "99px",
                                          background: "var(--tile)",
                                        }}
                                      ></span>
                                    </span>
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </div>
                          <figcaption
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "6px 16px",
                              alignItems: "baseline",
                              marginTop: "16px",
                            }}
                          >
                            <span
                              style={{
                                fontFamily:
                                  "var(--font-geist-mono), ui-monospace, monospace",
                                fontSize: "11px",
                                color: "var(--accent)",
                              }}
                            >
                              FIG 3
                            </span>
                            <span
                              style={{ fontSize: "15px", fontWeight: "600" }}
                            >
                              {md.s3t}
                            </span>
                            <span
                              style={{ fontSize: "14px", color: "var(--ink2)" }}
                            >
                              {md.s3d}
                            </span>
                          </figcaption>
                        </figure>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--sec) var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--sec) + 4px)",
                    }}
                  >
                    <div data-nd="k2" style={nd.k2}></div>
                  </div>
                  <div data-rv="2" style={rv.r2}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "var(--lkCols)",
                        gap: "40px 64px",
                        alignItems: "start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "12px",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "var(--ink3)",
                          }}
                        >
                          02 · Links
                        </span>
                        <h2
                          style={{
                            margin: "0",
                            fontFamily:
                              "var(--font-bricolage), var(--font-geist), sans-serif",
                            fontWeight: "700",
                            fontSize: "var(--h2)",
                            lineHeight: "1",
                            letterSpacing: "-0.04em",
                            textWrap: "balance",
                          }}
                        >
                          How {md.n} connects to other{" "}
                          <em
                            style={{
                              fontFamily: "var(--font-instrument-serif), serif",
                              fontStyle: "italic",
                              fontWeight: "400",
                              fontSize: "1.1em",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            modules
                          </em>
                          .
                        </h2>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "17px",
                            lineHeight: "1.55",
                            color: "var(--ink2)",
                            textWrap: "pretty",
                          }}
                        >
                          Live links work today. Dimmed links show where {md.n}{" "}
                          will connect when those modules ship.
                        </p>
                      </div>
                      <div
                        style={{ position: "relative", paddingLeft: "36px" }}
                      >
                        <div style={lkLine}></div>
                        <div
                          style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            padding: "0 0 22px",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              left: "-41px",
                              top: "9px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "99px",
                              background: "var(--accent)",
                              boxShadow:
                                "0 0 0 6px color-mix(in oklab, var(--accent) 20%, transparent), var(--glow)",
                            }}
                          ></span>
                          <span style={md.codeSt}>{md.code}</span>
                          <span
                            style={{
                              fontFamily:
                                "var(--font-bricolage), var(--font-geist), sans-serif",
                              fontWeight: "700",
                              fontSize: "26px",
                              letterSpacing: "-0.03em",
                            }}
                          >
                            {md.n}
                          </span>
                          <span
                            style={{
                              fontFamily:
                                "var(--font-geist-mono), ui-monospace, monospace",
                              fontSize: "12px",
                              color: "var(--ink3)",
                            }}
                          >
                            {md.lkMeta}
                          </span>
                        </div>
                        <div style={{ borderTop: "1px solid var(--line)" }}>
                          {mdLinks.map((l: any, i27: number) => (
                            <Fragment key={i27}>
                              <div style={l.rowSt}>
                                <span style={l.ndSt}></span>
                                <span style={l.codeSt}>{l.code}</span>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "4px 24px",
                                    alignItems: "baseline",
                                    minWidth: "0",
                                  }}
                                >
                                  <span
                                    style={{
                                      width: "var(--mnW)",
                                      fontSize: "16px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {l.n}
                                  </span>
                                  <span
                                    style={{
                                      flex: "1 1 240px",
                                      fontSize: "15px",
                                      lineHeight: "1.45",
                                      color: "var(--ink2)",
                                      textWrap: "pretty",
                                    }}
                                  >
                                    {l.t}
                                  </span>
                                </div>
                                <span style={l.chipSt}>{l.chipT}</span>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--sec) var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--sec) + 4px)",
                    }}
                  >
                    <div data-nd="k3" style={nd.k3}></div>
                  </div>
                  <div data-rv="3" style={rv.r3}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        maxWidth: "720px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        03 · Permissions
                      </span>
                      <h2
                        style={{
                          margin: "0",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h2)",
                          lineHeight: "1",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        Who can do{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          what
                        </em>{" "}
                        in {md.n}.
                      </h2>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "17px",
                          lineHeight: "1.55",
                          color: "var(--ink2)",
                          textWrap: "pretty",
                        }}
                      >
                        {md.n} uses the workspace roles. These are the defaults,
                        and Owners can change them in Roles & permissions.
                      </p>
                    </div>
                    <div
                      style={{
                        marginTop: "48px",
                        maxWidth: "980px",
                        backgroundColor: "var(--tile)",
                        backgroundImage: "var(--glass)",
                        border: "1px solid var(--line)",
                        borderRadius: "20px",
                        boxShadow: "var(--shadow)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "var(--mxCols)",
                          height: "52px",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            padding: "0 20px",
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            letterSpacing: ".06em",
                            textTransform: "uppercase",
                            color: "var(--ink3)",
                          }}
                        >
                          Permission
                        </div>
                        {roleNames.map((rl: any, i28: number) => (
                          <Fragment key={i28}>
                            <div
                              style={{
                                textAlign: "center",
                                fontFamily:
                                  "var(--font-geist-mono), ui-monospace, monospace",
                                fontSize: "11px",
                                color: "var(--ink2)",
                              }}
                            >
                              {rl}
                            </div>
                          </Fragment>
                        ))}
                      </div>
                      {mdPerm.map((r: any, i29: number) => (
                        <Fragment key={i29}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "var(--mxCols)",
                              minHeight: "48px",
                              borderTop: "1px solid var(--line2)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 20px",
                                fontSize: "14px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={{ fontWeight: "500" }}>{r.mod}</span>
                              <span style={{ color: "var(--ink2)" }}>
                                {r.act}
                              </span>
                            </div>
                            {r.cells.map((c: any, i30: number) => (
                              <Fragment key={i30}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <span style={c.g}>{c.t}</span>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px 24px",
                        marginTop: "20px",
                        fontFamily:
                          "var(--font-geist-mono), ui-monospace, monospace",
                        fontSize: "12px",
                        color: "var(--ink2)",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "99px",
                            background: "var(--ink)",
                          }}
                        ></span>
                        Allowed
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            border: "1px solid var(--line)",
                            borderRadius: "99px",
                            padding: "1px 7px",
                          }}
                        >
                          own
                        </span>
                        Only their own items
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            border: "1px solid var(--line)",
                            borderRadius: "99px",
                            padding: "1px 7px",
                          }}
                        >
                          shared
                        </span>
                        Only items shared with them
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            width: "10px",
                            height: "1.5px",
                            background: "var(--ink3)",
                          }}
                        ></span>
                        Not allowed
                      </span>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            {pg.roadmap ? (
              <>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--heroT) var(--pr) 0 var(--px)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      bottom: "0",
                      left: "50%",
                      width: "200px",
                      background:
                        "linear-gradient(to bottom, transparent, var(--beam) 45%, transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      top: "-240px",
                      left: "35%",
                      width: "1000px",
                      height: "800px",
                      background:
                        "radial-gradient(closest-side, var(--wash), transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--heroT) + 4px)",
                    }}
                  >
                    <div data-nd="k0" style={nd.k0}></div>
                  </div>
                  <div data-rv="0" style={rv.r0}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "28px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        Roadmap · 11 coming · no dates yet
                      </span>
                      <h1
                        style={{
                          margin: "0",
                          maxWidth: "1000px",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h1)",
                          lineHeight: "0.98",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        Modules we are{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          building
                        </em>{" "}
                        next.
                      </h1>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "32px 64px",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                        }}
                      >
                        <p
                          style={{
                            margin: "0",
                            maxWidth: "560px",
                            fontSize: "var(--lead)",
                            lineHeight: "1.5",
                            color: "var(--ink2)",
                            textWrap: "pretty",
                          }}
                        >
                          None of these are live yet. Each one will join the
                          same workspace, roles, search and audit log when it
                          ships. Ship dates are not set.
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <a
                            href="/auth/sign-up"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: "48px",
                              padding: "0 24px",
                              borderRadius: "999px",
                              background: "var(--btn)",
                              color: "var(--btn-ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            Start free
                          </a>
                          <button
                            onClick={notifyAll}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              height: "48px",
                              padding: "0 22px",
                              borderRadius: "999px",
                              border: "1px solid var(--line)",
                              background: "transparent",
                              color: "var(--ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              cursor: "pointer",
                            }}
                          >
                            <span style={ico.bell}></span>
                            {notifyAllT}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "120px var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "96px",
                    }}
                  >
                    {rmGroups.map((g: any, i31: number) => (
                      <Fragment key={i31}>
                        <div data-rv={g.rvk} style={g.rv}>
                          <div style={{ position: "relative" }}>
                            <div style={g.br}></div>
                            <div
                              style={{
                                position: "absolute",
                                top: "34px",
                                left: "calc(var(--tx) - var(--px) - 4.5px)",
                              }}
                            >
                              <div data-nd={g.k} style={g.nd}></div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: "16px",
                                paddingBottom: "24px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily:
                                    "var(--font-geist-mono), ui-monospace, monospace",
                                  fontSize: "11px",
                                  letterSpacing: ".06em",
                                  color: "var(--ink3)",
                                }}
                              >
                                {g.idx}
                              </span>
                              <span
                                style={{
                                  fontFamily:
                                    "var(--font-bricolage), var(--font-geist), sans-serif",
                                  fontWeight: "700",
                                  fontSize: "40px",
                                  letterSpacing: "-0.04em",
                                }}
                              >
                                {g.name}
                              </span>
                              <span
                                style={{
                                  fontFamily:
                                    "var(--font-geist-mono), ui-monospace, monospace",
                                  fontSize: "12px",
                                  color: "var(--ink3)",
                                }}
                              >
                                {g.meta}
                              </span>
                            </div>
                            {g.rows.map((r: any, i32: number) => (
                              <Fragment key={i32}>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "var(--rmCols)",
                                    gap: "28px 64px",
                                    padding: "40px 0",
                                    borderTop: "1px solid var(--line2)",
                                    alignItems: "start",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "16px",
                                      alignItems: "flex-start",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "14px",
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <span style={r.codeSt}>{r.code}</span>
                                      <span
                                        style={{
                                          fontFamily:
                                            "var(--font-bricolage), var(--font-geist), sans-serif",
                                          fontWeight: "700",
                                          fontSize: "30px",
                                          letterSpacing: "-0.03em",
                                        }}
                                      >
                                        {r.n}
                                      </span>
                                      <span
                                        style={{
                                          fontFamily:
                                            "var(--font-geist-mono), ui-monospace, monospace",
                                          fontSize: "11px",
                                          color: "var(--ink2)",
                                          border: "1px dashed var(--ink3)",
                                          borderRadius: "999px",
                                          padding: "2px 9px",
                                        }}
                                      >
                                        Coming
                                      </span>
                                    </div>
                                    <p
                                      style={{
                                        margin: "0",
                                        maxWidth: "440px",
                                        fontSize: "17px",
                                        lineHeight: "1.55",
                                        color: "var(--ink2)",
                                        textWrap: "pretty",
                                      }}
                                    >
                                      {r.d}
                                    </p>
                                    {r.notN ? (
                                      <>
                                        <button
                                          onClick={r.click}
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            height: "42px",
                                            padding: "0 18px",
                                            borderRadius: "999px",
                                            border: "1px solid var(--line)",
                                            background: "transparent",
                                            color: "var(--ink)",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            cursor: "pointer",
                                          }}
                                        >
                                          <span style={ico.bell}></span>Notify
                                          me
                                        </button>
                                      </>
                                    ) : null}
                                    {r.isN ? (
                                      <>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            minHeight: "42px",
                                            flexWrap: "wrap",
                                          }}
                                        >
                                          <span
                                            style={{
                                              width: "20px",
                                              height: "20px",
                                              borderRadius: "99px",
                                              background: "var(--green)",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                            }}
                                          >
                                            <span style={ico.checkInv}></span>
                                          </span>
                                          <span style={{ fontSize: "14px" }}>
                                            {r.done}
                                          </span>
                                          <button
                                            onClick={r.click}
                                            style={{
                                              height: "30px",
                                              padding: "0 10px",
                                              border: "none",
                                              background: "none",
                                              color: "var(--ink3)",
                                              fontSize: "13px",
                                              cursor: "pointer",
                                              textDecoration: "underline",
                                            }}
                                          >
                                            Undo
                                          </button>
                                        </div>
                                      </>
                                    ) : null}
                                    <span
                                      style={{
                                        fontFamily:
                                          "var(--font-geist-mono), ui-monospace, monospace",
                                        fontSize: "11px",
                                        color: "var(--ink3)",
                                      }}
                                    >
                                      No date yet
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "10px",
                                      minWidth: "0",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontFamily:
                                          "var(--font-geist-mono), ui-monospace, monospace",
                                        fontSize: "11px",
                                        letterSpacing: ".08em",
                                        color: "var(--ink2)",
                                      }}
                                    >
                                      PREVIEW · NOT LIVE
                                    </span>
                                    <div
                                      style={{
                                        pointerEvents: "none",
                                        opacity: ".42",
                                        WebkitMaskImage:
                                          "linear-gradient(180deg, black 45%, transparent)",
                                        maskImage:
                                          "linear-gradient(180deg, black 45%, transparent)",
                                      }}
                                    >
                                      <div
                                        style={{
                                          borderRadius: "20px",
                                          border: "1px dashed var(--line)",
                                          padding: "6px 16px 10px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            height: "36px",
                                            fontFamily:
                                              "var(--font-geist-mono), ui-monospace, monospace",
                                            fontSize: "11px",
                                            color: "var(--ink3)",
                                            borderBottom:
                                              "1px solid var(--line2)",
                                          }}
                                        >
                                          {r.url}
                                        </div>
                                        {r.prev.map((x: any, i33: number) => (
                                          <Fragment key={i33}>
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "16px",
                                                minHeight: "50px",
                                                borderBottom:
                                                  "1px solid var(--line2)",
                                              }}
                                            >
                                              <span
                                                style={{
                                                  fontSize: "14px",
                                                  fontWeight: "500",
                                                }}
                                              >
                                                {x.a}
                                              </span>
                                              <span
                                                style={{
                                                  marginLeft: "auto",
                                                  fontFamily:
                                                    "var(--font-geist-mono), ui-monospace, monospace",
                                                  fontSize: "12px",
                                                  color: "var(--ink2)",
                                                  textAlign: "right",
                                                }}
                                              >
                                                {x.b}
                                              </span>
                                            </div>
                                          </Fragment>
                                        ))}
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "16px",
                                            height: "50px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              width: "40%",
                                              height: "8px",
                                              borderRadius: "6px",
                                              background: "var(--line)",
                                            }}
                                          ></span>
                                          <span
                                            style={{
                                              marginLeft: "auto",
                                              width: "18%",
                                              height: "8px",
                                              borderRadius: "6px",
                                              background: "var(--line2)",
                                            }}
                                          ></span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
            {pg.security ? (
              <>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--heroT) var(--pr) 0 var(--px)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      bottom: "0",
                      left: "58%",
                      width: "200px",
                      background:
                        "linear-gradient(to bottom, transparent, var(--beam) 45%, transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      top: "-240px",
                      left: "35%",
                      width: "1000px",
                      height: "800px",
                      background:
                        "radial-gradient(closest-side, var(--wash), transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--heroT) + 4px)",
                    }}
                  >
                    <div data-nd="k0" style={nd.k0}></div>
                  </div>
                  <div data-rv="0" style={rv.r0}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "28px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        Security · what is live today
                      </span>
                      <h1
                        style={{
                          margin: "0",
                          maxWidth: "1080px",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h1)",
                          lineHeight: "0.98",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        One permission{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          system
                        </em>
                        , and a log of every change.
                      </h1>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "32px 64px",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                        }}
                      >
                        <p
                          style={{
                            margin: "0",
                            maxWidth: "580px",
                            fontSize: "var(--lead)",
                            lineHeight: "1.5",
                            color: "var(--ink2)",
                            textWrap: "pretty",
                          }}
                        >
                          This page covers what Zentro does today: roles that
                          apply across every module, access that carries from a
                          project to its work, and an audit log of every change.
                          It lists nothing that is not live.
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <a
                            href={hrefOf(go.about)}
                            onClick={go.about}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: "48px",
                              padding: "0 24px",
                              borderRadius: "999px",
                              background: "var(--btn)",
                              color: "var(--btn-ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            Ask a security question
                          </a>
                          <a
                            href="#roles"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: "48px",
                              padding: "0 22px",
                              borderRadius: "999px",
                              border: "1px solid var(--line)",
                              color: "var(--ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            See the roles
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  id="roles"
                  style={{
                    position: "relative",
                    padding: "var(--sec) var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--sec) + 4px)",
                    }}
                  >
                    <div data-nd="k1" style={nd.k1}></div>
                  </div>
                  <div data-rv="1" style={rv.r1}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        maxWidth: "720px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        01 · Roles
                      </span>
                      <h2
                        style={{
                          margin: "0",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h2)",
                          lineHeight: "1",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        Four roles, the same in every{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          module
                        </em>
                        .
                      </h2>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "var(--rlCols)",
                        marginTop: "48px",
                        borderTop: "1px solid var(--line)",
                      }}
                    >
                      {secRoles.map((r: any, i34: number) => (
                        <Fragment key={i34}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px",
                              padding: "24px 24px 28px 0",
                              borderBottom: "1px solid var(--line2)",
                            }}
                          >
                            <span
                              style={{
                                fontFamily:
                                  "var(--font-geist-mono), ui-monospace, monospace",
                                fontSize: "11px",
                                color: "var(--ink3)",
                              }}
                            >
                              {r.idx}
                            </span>
                            <span
                              style={{
                                fontFamily:
                                  "var(--font-bricolage), var(--font-geist), sans-serif",
                                fontWeight: "700",
                                fontSize: "28px",
                                letterSpacing: "-0.03em",
                              }}
                            >
                              {r.n}
                            </span>
                            <span
                              style={{
                                fontSize: "15px",
                                lineHeight: "1.5",
                                color: "var(--ink2)",
                                textWrap: "pretty",
                              }}
                            >
                              {r.d}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div
                      style={{
                        marginTop: "40px",
                        backgroundColor: "var(--tile)",
                        backgroundImage: "var(--glass)",
                        border: "1px solid var(--line)",
                        borderRadius: "20px",
                        boxShadow: "var(--shadow)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "16px 20px",
                          borderBottom: "1px solid var(--line2)",
                        }}
                      >
                        <span style={{ fontSize: "15px", fontWeight: "600" }}>
                          Default permissions
                        </span>
                        <span
                          style={{
                            marginLeft: "auto",
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            color: "var(--ink3)",
                          }}
                        >
                          Owners can change these
                        </span>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "var(--mxCols)",
                          height: "48px",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            padding: "0 20px",
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            letterSpacing: ".06em",
                            textTransform: "uppercase",
                            color: "var(--ink3)",
                          }}
                        >
                          Permission
                        </div>
                        {roleNames.map((rl: any, i35: number) => (
                          <Fragment key={i35}>
                            <div
                              style={{
                                textAlign: "center",
                                fontFamily:
                                  "var(--font-geist-mono), ui-monospace, monospace",
                                fontSize: "11px",
                                color: "var(--ink2)",
                              }}
                            >
                              {rl}
                            </div>
                          </Fragment>
                        ))}
                      </div>
                      {secMatrix.map((r: any, i36: number) => (
                        <Fragment key={i36}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "var(--mxCols)",
                              minHeight: "46px",
                              borderTop: "1px solid var(--line2)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 20px",
                                fontSize: "14px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={{ fontWeight: "500" }}>{r.mod}</span>
                              <span style={{ color: "var(--ink2)" }}>
                                {r.act}
                              </span>
                            </div>
                            {r.cells.map((c: any, i37: number) => (
                              <Fragment key={i37}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <span style={c.g}>{c.t}</span>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--sec) var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--sec) + 4px)",
                    }}
                  >
                    <div data-nd="k2" style={nd.k2}></div>
                  </div>
                  <div data-rv="2" style={rv.r2}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "var(--lkCols)",
                        gap: "40px 64px",
                        alignItems: "start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "12px",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "var(--ink3)",
                          }}
                        >
                          02 · One permission system
                        </span>
                        <h2
                          style={{
                            margin: "0",
                            fontFamily:
                              "var(--font-bricolage), var(--font-geist), sans-serif",
                            fontWeight: "700",
                            fontSize: "var(--h2)",
                            lineHeight: "1",
                            letterSpacing: "-0.04em",
                            textWrap: "balance",
                          }}
                        >
                          Access set once, carried{" "}
                          <em
                            style={{
                              fontFamily: "var(--font-instrument-serif), serif",
                              fontStyle: "italic",
                              fontWeight: "400",
                              fontSize: "1.1em",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            everywhere
                          </em>
                          .
                        </h2>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "17px",
                            lineHeight: "1.55",
                            color: "var(--ink2)",
                            textWrap: "pretty",
                          }}
                        >
                          There is no separate permission setup per module. Each
                          step below narrows or extends the one before it.
                        </p>
                      </div>
                      <div
                        style={{ position: "relative", paddingLeft: "36px" }}
                      >
                        <div style={chainLine}></div>
                        {chain.map((c: any, i38: number) => (
                          <Fragment key={i38}>
                            <div
                              style={{
                                position: "relative",
                                display: "flex",
                                gap: "20px",
                                padding: "20px 0 24px",
                                borderBottom: "1px solid var(--line2)",
                              }}
                            >
                              <span style={c.ndSt}></span>
                              <span
                                style={{
                                  fontFamily:
                                    "var(--font-geist-mono), ui-monospace, monospace",
                                  fontSize: "12px",
                                  color: "var(--ink3)",
                                  width: "20px",
                                  paddingTop: "4px",
                                }}
                              >
                                {c.i}
                              </span>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    letterSpacing: "-0.01em",
                                  }}
                                >
                                  {c.t}
                                </span>
                                <span
                                  style={{
                                    fontSize: "15px",
                                    lineHeight: "1.5",
                                    color: "var(--ink2)",
                                    textWrap: "pretty",
                                  }}
                                >
                                  {c.d}
                                </span>
                              </div>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--sec) var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--sec) + 4px)",
                    }}
                  >
                    <div data-nd="k3" style={nd.k3}></div>
                  </div>
                  <div data-rv="3" style={rv.r3}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        maxWidth: "720px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        03 · Audit log
                      </span>
                      <h2
                        style={{
                          margin: "0",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h2)",
                          lineHeight: "1",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        Every change, who made it and{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          when
                        </em>
                        .
                      </h2>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "17px",
                          lineHeight: "1.55",
                          color: "var(--ink2)",
                          textWrap: "pretty",
                        }}
                      >
                        Role changes, module switches, shares and edits in every
                        module go to one log. Owners and Admins can read it. The
                        entries below are an example.
                      </p>
                    </div>
                    <div
                      style={{
                        marginTop: "48px",
                        borderTop: "1px solid var(--line)",
                      }}
                    >
                      {notM ? (
                        <>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "var(--auCols)",
                              gap: "16px",
                              padding: "12px 0",
                              fontFamily:
                                "var(--font-geist-mono), ui-monospace, monospace",
                              fontSize: "11px",
                              letterSpacing: ".06em",
                              textTransform: "uppercase",
                              color: "var(--ink3)",
                              borderBottom: "1px solid var(--line2)",
                            }}
                          >
                            <span>When</span>
                            <span>Who</span>
                            <span>What</span>
                            <span>Module</span>
                          </div>
                        </>
                      ) : null}
                      {audit.map((a: any, i39: number) => (
                        <Fragment key={i39}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "var(--auCols)",
                              gap: "6px 16px",
                              padding: "16px 0",
                              borderBottom: "1px solid var(--line2)",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontFamily:
                                  "var(--font-geist-mono), ui-monospace, monospace",
                                fontSize: "12px",
                                color: "var(--ink3)",
                              }}
                            >
                              {a.t}
                            </span>
                            <span
                              style={{ fontSize: "14px", fontWeight: "500" }}
                            >
                              {a.w}
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                lineHeight: "1.45",
                                color: "var(--ink2)",
                              }}
                            >
                              {a.a}
                            </span>
                            <span style={a.tag}>{a.mod}</span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--sec) var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--sec) + 4px)",
                    }}
                  >
                    <div data-nd="k4" style={nd.k4}></div>
                  </div>
                  <div data-rv="4" style={rv.r4}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        maxWidth: "760px",
                        padding: "32px 0 0",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        04 · Scope of this page
                      </span>
                      <h2
                        style={{
                          margin: "0",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h2)",
                          lineHeight: "1",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        What this page does not{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          cover
                        </em>
                        .
                      </h2>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "17px",
                          lineHeight: "1.55",
                          color: "var(--ink2)",
                          textWrap: "pretty",
                        }}
                      >
                        Certifications, single sign-on, two-factor sign-in and
                        encryption are not described here. If your team needs
                        answers on any of them before signing up, send us a
                        question and we will tell you where each one stands.
                      </p>
                      <a
                        href={hrefOf(go.about)}
                        onClick={go.about}
                        style={{
                          alignSelf: "flex-start",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          height: "44px",
                          padding: "0 20px",
                          borderRadius: "999px",
                          border: "1px solid var(--line)",
                          color: "var(--ink)",
                          fontSize: "14px",
                          fontWeight: "500",
                          textDecoration: "none",
                          marginTop: "8px",
                        }}
                      >
                        Ask a security question<span style={ico.arrow}></span>
                      </a>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            {pg.changelog ? (
              <>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--heroT) var(--pr) 0 var(--px)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      bottom: "0",
                      left: "62%",
                      width: "200px",
                      background:
                        "linear-gradient(to bottom, transparent, var(--beam) 45%, transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      top: "-240px",
                      left: "35%",
                      width: "1000px",
                      height: "800px",
                      background:
                        "radial-gradient(closest-side, var(--wash), transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--heroT) + 4px)",
                    }}
                  >
                    <div data-nd="k0" style={nd.k0}></div>
                  </div>
                  <div data-rv="0" style={rv.r0}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "28px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        Changelog
                      </span>
                      <h1
                        style={{
                          margin: "0",
                          maxWidth: "1000px",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h1)",
                          lineHeight: "0.98",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        What{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          shipped
                        </em>
                        , newest first.
                      </h1>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "32px 64px",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                        }}
                      >
                        <p
                          style={{
                            margin: "0",
                            maxWidth: "560px",
                            fontSize: "var(--lead)",
                            lineHeight: "1.5",
                            color: "var(--ink2)",
                            textWrap: "pretty",
                          }}
                        >
                          Each entry is a change to a live module, dated the day
                          it reached every workspace.
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <a
                            href="/auth/sign-up"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: "48px",
                              padding: "0 24px",
                              borderRadius: "999px",
                              background: "var(--btn)",
                              color: "var(--btn-ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            Start free
                          </a>
                          <a
                            href="#"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              height: "48px",
                              padding: "0 22px",
                              borderRadius: "999px",
                              border: "1px solid var(--line)",
                              color: "var(--ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            <span style={ico.bell}></span>Get updates by email
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "96px var(--pr) 0 var(--px)",
                  }}
                >
                  <div data-rv="1" style={rv.r1}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        paddingBottom: "20px",
                      }}
                    >
                      {clChips.map((c: any, i40: number) => (
                        <Fragment key={i40}>
                          <button onClick={c.go} style={c.st}>
                            {c.l}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "14px 0",
                        borderTop: "1px solid var(--line)",
                        fontSize: "14px",
                        color: "var(--ink2)",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "11px",
                          letterSpacing: ".06em",
                          textTransform: "uppercase",
                          color: "var(--amber)",
                          border: "1px dashed var(--amber)",
                          borderRadius: "999px",
                          padding: "2px 9px",
                        }}
                      >
                        Placeholder
                      </span>
                      Sample entries based on the current product. Dates are
                      placeholders.
                    </div>
                  </div>
                  {entries.map((e: any, i41: number) => (
                    <Fragment key={i41}>
                      <div data-rv={e.rvk} style={e.rv}>
                        <div
                          style={{
                            position: "relative",
                            display: "grid",
                            gridTemplateColumns: "var(--clCols)",
                            gap: "12px 40px",
                            padding: "36px 0",
                            borderTop: "1px solid var(--line2)",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: "41px",
                              left: "calc(var(--tx) - var(--px) - 4.5px)",
                            }}
                          >
                            <div data-nd={e.k} style={e.nd}></div>
                          </div>
                          <span
                            style={{
                              fontFamily:
                                "var(--font-geist-mono), ui-monospace, monospace",
                              fontSize: "13px",
                              color: "var(--ink2)",
                              paddingTop: "2px",
                            }}
                          >
                            {e.d}
                          </span>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              maxWidth: "640px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "22px",
                                fontWeight: "600",
                                letterSpacing: "-0.015em",
                                lineHeight: "1.25",
                              }}
                            >
                              {e.t}
                            </span>
                            <span
                              style={{
                                fontSize: "16px",
                                lineHeight: "1.55",
                                color: "var(--ink2)",
                                textWrap: "pretty",
                              }}
                            >
                              {e.x}
                            </span>
                          </div>
                          <span style={e.tag}>{e.mod}</span>
                        </div>
                      </div>
                    </Fragment>
                  ))}
                  {clEmpty ? (
                    <>
                      <div
                        style={{
                          padding: "48px 0",
                          borderTop: "1px solid var(--line2)",
                          fontSize: "16px",
                          color: "var(--ink2)",
                        }}
                      >
                        No entries for this module yet.
                      </div>
                    </>
                  ) : null}
                </section>
              </>
            ) : null}
            {pg.legal ? (
              <>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--heroT) var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--heroT) + 4px)",
                    }}
                  >
                    <div data-nd="k0" style={nd.k0}></div>
                  </div>
                  <div data-rv="0" style={rv.r0}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        Legal
                      </span>
                      <h1
                        style={{
                          margin: "0",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h1)",
                          lineHeight: "0.98",
                          letterSpacing: "-0.04em",
                        }}
                      >
                        {L.pre}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {L.em}
                        </em>
                        {L.post}
                      </h1>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "16px 32px",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "13px",
                            color: "var(--ink2)",
                          }}
                        >
                          Last updated{" "}
                          <span
                            style={{
                              color: "var(--amber)",
                              borderBottom: "1px dashed var(--amber)",
                            }}
                          >
                            [Month DD, YYYY]
                          </span>
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: "2px",
                            padding: "3px",
                            border: "1px solid var(--line)",
                            borderRadius: "999px",
                          }}
                        >
                          {legalTabs.map((b: any, i42: number) => (
                            <Fragment key={i42}>
                              <button style={b.st} onClick={b.go}>
                                {b.l}
                              </button>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "14px",
                          alignItems: "flex-start",
                          padding: "16px 18px",
                          border: "1px dashed var(--amber)",
                          borderRadius: "14px",
                          fontSize: "14px",
                          lineHeight: "1.5",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            letterSpacing: ".06em",
                            color: "var(--amber)",
                            whiteSpace: "nowrap",
                            paddingTop: "2px",
                          }}
                        >
                          PLACEHOLDER TEXT
                        </span>
                        <span style={{ color: "var(--ink2)" }}>
                          The text below is lorem ipsum. It is not Zentro’s
                          policy and has no legal effect.
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "64px var(--pr) 0 var(--px)",
                  }}
                >
                  <div data-rv="1" style={rv.r1}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "var(--lgCols)",
                        gap: "32px 96px",
                        alignItems: "start",
                      }}
                    >
                      <aside
                        style={{
                          display: "var(--tocD)",
                          flexDirection: "column",
                          position: "sticky",
                          top: "96px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "var(--ink3)",
                            paddingBottom: "12px",
                          }}
                        >
                          On this page
                        </span>
                        {toc.map((t: any, i43: number) => (
                          <Fragment key={i43}>
                            <button onClick={t.go} style={t.st}>
                              <span
                                style={{
                                  fontFamily:
                                    "var(--font-geist-mono), ui-monospace, monospace",
                                  fontSize: "11px",
                                  color: "var(--ink3)",
                                }}
                              >
                                {t.n}
                              </span>
                              {t.t}
                            </button>
                          </Fragment>
                        ))}
                      </aside>
                      <article style={{ minWidth: "0", maxWidth: "720px" }}>
                        <div
                          style={{
                            display: "var(--tocM)",
                            borderTop: "1px solid var(--line)",
                            borderBottom: "1px solid var(--line2)",
                            marginBottom: "8px",
                          }}
                        >
                          <button
                            onClick={toggleToc}
                            style={{
                              width: "100%",
                              height: "52px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              background: "none",
                              border: "none",
                              color: "var(--ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              cursor: "pointer",
                              padding: "0",
                            }}
                          >
                            <span style={{ flex: "1", textAlign: "left" }}>
                              {tocLabel}
                            </span>
                            <span style={tocChev}></span>
                          </button>
                          {tocOpen ? (
                            <>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  paddingBottom: "14px",
                                }}
                              >
                                {toc.map((t: any, i44: number) => (
                                  <Fragment key={i44}>
                                    <button onClick={t.go} style={t.st}>
                                      <span
                                        style={{
                                          fontFamily:
                                            "var(--font-geist-mono), ui-monospace, monospace",
                                          fontSize: "11px",
                                          color: "var(--ink3)",
                                        }}
                                      >
                                        {t.n}
                                      </span>
                                      {t.t}
                                    </button>
                                  </Fragment>
                                ))}
                              </div>
                            </>
                          ) : null}
                        </div>
                        {secs.map((x: any, i45: number) => (
                          <Fragment key={i45}>
                            <div
                              style={{
                                padding: "36px 0 8px",
                                borderTop: "1px solid var(--line2)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "baseline",
                                  gap: "14px",
                                  marginBottom: "16px",
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily:
                                      "var(--font-geist-mono), ui-monospace, monospace",
                                    fontSize: "12px",
                                    color: "var(--ink3)",
                                  }}
                                >
                                  {x.n}
                                </span>
                                <h2
                                  style={{
                                    margin: "0",
                                    fontFamily:
                                      "var(--font-bricolage), var(--font-geist), sans-serif",
                                    fontWeight: "700",
                                    fontSize: "26px",
                                    letterSpacing: "-0.03em",
                                    lineHeight: "1.15",
                                  }}
                                >
                                  {x.t}
                                </h2>
                              </div>
                              {x.paras.map((pp: any, i46: number) => (
                                <Fragment key={i46}>
                                  <p
                                    style={{
                                      margin: "0 0 18px",
                                      fontSize: "17px",
                                      lineHeight: "1.7",
                                      color: "var(--ink)",
                                      textWrap: "pretty",
                                    }}
                                  >
                                    {pp}
                                  </p>
                                </Fragment>
                              ))}
                            </div>
                          </Fragment>
                        ))}
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "20px",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: "32px",
                            padding: "28px 0 0",
                            borderTop: "1px solid var(--line)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <span
                              style={{ fontSize: "18px", fontWeight: "600" }}
                            >
                              Questions about this policy?
                            </span>
                            <span
                              style={{ fontSize: "15px", color: "var(--ink2)" }}
                            >
                              Choose “Other” as the topic and we will reply by
                              email.
                            </span>
                          </div>
                          <a
                            href={hrefOf(go.about)}
                            onClick={go.about}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: "48px",
                              padding: "0 24px",
                              borderRadius: "999px",
                              background: "var(--btn)",
                              color: "var(--btn-ink)",
                              fontSize: "15px",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            Contact us
                          </a>
                        </div>
                      </article>
                    </div>
                  </div>
                  <div style={{ height: "var(--sec)" }}></div>
                </section>
              </>
            ) : null}
            {pg.about ? (
              <>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--heroT) var(--pr) 0 var(--px)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      bottom: "0",
                      left: "54%",
                      width: "200px",
                      background:
                        "linear-gradient(to bottom, transparent, var(--beam) 45%, transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      top: "-240px",
                      left: "35%",
                      width: "1000px",
                      height: "800px",
                      background:
                        "radial-gradient(closest-side, var(--wash), transparent)",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--heroT) + 4px)",
                    }}
                  >
                    <div data-nd="k0" style={nd.k0}></div>
                  </div>
                  <div data-rv="0" style={rv.r0}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "28px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        About
                      </span>
                      <h1
                        style={{
                          margin: "0",
                          maxWidth: "1000px",
                          fontFamily:
                            "var(--font-bricolage), var(--font-geist), sans-serif",
                          fontWeight: "700",
                          fontSize: "var(--h1)",
                          lineHeight: "0.98",
                          letterSpacing: "-0.04em",
                          textWrap: "balance",
                        }}
                      >
                        One workspace instead of ten{" "}
                        <em
                          style={{
                            fontFamily: "var(--font-instrument-serif), serif",
                            fontStyle: "italic",
                            fontWeight: "400",
                            fontSize: "1.1em",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          tools
                        </em>
                        .
                      </h1>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "32px 64px",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                        }}
                      >
                        <p
                          style={{
                            margin: "0",
                            maxWidth: "580px",
                            fontSize: "var(--lead)",
                            lineHeight: "1.5",
                            color: "var(--ink2)",
                            textWrap: "pretty",
                          }}
                        >
                          Zentro is one workspace for everything a company runs
                          on: projects, tasks, docs and teams under one
                          permission system and one search. You switch on only
                          the modules you use.
                        </p>
                        <a
                          href="#contact"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            height: "48px",
                            padding: "0 22px",
                            borderRadius: "999px",
                            border: "1px solid var(--line)",
                            color: "var(--ink)",
                            fontSize: "15px",
                            fontWeight: "500",
                            textDecoration: "none",
                          }}
                        >
                          Write to us<span style={ico.arrow}></span>
                        </a>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--sec) var(--pr) 0 var(--px)",
                  }}
                >
                  <div data-rv="1" style={rv.r1}>
                    <span
                      style={{
                        fontFamily:
                          "var(--font-geist-mono), ui-monospace, monospace",
                        fontSize: "12px",
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: "var(--ink3)",
                      }}
                    >
                      01 · How we build it
                    </span>
                    <div
                      style={{
                        marginTop: "28px",
                        borderTop: "1px solid var(--line)",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "var(--abCols)",
                          gap: "10px 64px",
                          padding: "28px 0",
                          borderBottom: "1px solid var(--line2)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "20px",
                            fontWeight: "600",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          One workspace
                        </span>
                        <span
                          style={{
                            fontSize: "17px",
                            lineHeight: "1.6",
                            color: "var(--ink2)",
                            maxWidth: "640px",
                            textWrap: "pretty",
                          }}
                        >
                          Every module shares the same people, roles, search and
                          audit log. A task, its doc and its owner are one
                          search away, and access is set once.
                        </span>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "var(--abCols)",
                          gap: "10px 64px",
                          padding: "28px 0",
                          borderBottom: "1px solid var(--line2)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "20px",
                            fontWeight: "600",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          One module at a time
                        </span>
                        <span
                          style={{
                            fontSize: "17px",
                            lineHeight: "1.6",
                            color: "var(--ink2)",
                            maxWidth: "640px",
                            textWrap: "pretty",
                          }}
                        >
                          Seven modules are live. Eleven more are on the public
                          roadmap. Each one ships into the same workspace
                          instead of as a separate product.
                        </span>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "var(--abCols)",
                          gap: "10px 64px",
                          padding: "28px 0",
                          borderBottom: "1px solid var(--line2)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "20px",
                            fontWeight: "600",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          Only what is live
                        </span>
                        <span
                          style={{
                            fontSize: "17px",
                            lineHeight: "1.6",
                            color: "var(--ink2)",
                            maxWidth: "640px",
                            textWrap: "pretty",
                          }}
                        >
                          Pages on this site describe what works today. Anything
                          coming is marked as coming, and nothing gets a date
                          until it is ready.
                        </span>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "var(--abCols)",
                          gap: "10px 64px",
                          padding: "28px 0",
                          borderBottom: "1px solid var(--line2)",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "20px",
                            fontWeight: "600",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          Team
                        </span>
                        <span
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                            alignItems: "center",
                            fontSize: "16px",
                            lineHeight: "1.6",
                            color: "var(--ink3)",
                          }}
                        >
                          <span
                            style={{
                              fontFamily:
                                "var(--font-geist-mono), ui-monospace, monospace",
                              fontSize: "11px",
                              letterSpacing: ".06em",
                              color: "var(--amber)",
                              border: "1px dashed var(--amber)",
                              borderRadius: "999px",
                              padding: "2px 9px",
                            }}
                          >
                            PLACEHOLDER
                          </span>
                          Add who is behind Zentro, where you are based and when
                          you started.
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  id="contact"
                  style={{
                    position: "relative",
                    padding: "var(--sec) var(--pr) var(--sec) var(--px)",
                  }}
                >
                  <div data-rv="2" style={rv.r2}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "var(--lkCols)",
                        gap: "40px 64px",
                        alignItems: "start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "12px",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "var(--ink3)",
                          }}
                        >
                          02 · Contact
                        </span>
                        <h2
                          style={{
                            margin: "0",
                            fontFamily:
                              "var(--font-bricolage), var(--font-geist), sans-serif",
                            fontWeight: "700",
                            fontSize: "var(--h2)",
                            lineHeight: "1",
                            letterSpacing: "-0.04em",
                          }}
                        >
                          Write to{" "}
                          <em
                            style={{
                              fontFamily: "var(--font-instrument-serif), serif",
                              fontStyle: "italic",
                              fontWeight: "400",
                              fontSize: "1.1em",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            us
                          </em>
                          .
                        </h2>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "17px",
                            lineHeight: "1.55",
                            color: "var(--ink2)",
                            textWrap: "pretty",
                          }}
                        >
                          Sales, support, security or anything else. Choose a
                          topic so your message reaches the right person. We
                          reply by email.
                        </p>
                      </div>
                      <div style={{ maxWidth: "720px" }}>
                        {notSent ? (
                          <>
                            <form
                              onSubmit={submit}
                              noValidate
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "22px",
                              }}
                            >
                              {hasErrs ? (
                                <>
                                  <div
                                    role="alert"
                                    style={{
                                      display: "flex",
                                      gap: "12px",
                                      alignItems: "flex-start",
                                      padding: "14px 16px",
                                      borderRadius: "14px",
                                      border: "1px solid var(--rose)",
                                      background:
                                        "color-mix(in oklab, var(--rose) 8%, transparent)",
                                      fontSize: "14px",
                                      lineHeight: "1.5",
                                    }}
                                  >
                                    <span style={ico.alert}></span>
                                    <span>{errSummary}</span>
                                  </div>
                                </>
                              ) : null}
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "var(--fmCols)",
                                  gap: "22px",
                                }}
                              >
                                <label
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    Name
                                  </span>
                                  <input
                                    value={fm.name.val}
                                    onChange={fm.name.onChange}
                                    onBlur={fm.name.onBlur}
                                    placeholder="Mira Okafor"
                                    style={fm.name.inSt}
                                  />
                                  {fm.name.has ? (
                                    <>
                                      <span
                                        style={{
                                          fontSize: "13px",
                                          lineHeight: "1.45",
                                          color: "var(--rose)",
                                        }}
                                      >
                                        {fm.name.err}
                                      </span>
                                    </>
                                  ) : null}
                                </label>
                                <label
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    Work email
                                  </span>
                                  <input
                                    value={fm.email.val}
                                    onChange={fm.email.onChange}
                                    onBlur={fm.email.onBlur}
                                    placeholder="name@company.com"
                                    style={fm.email.inSt}
                                  />
                                  {fm.email.has ? (
                                    <>
                                      <span
                                        style={{
                                          fontSize: "13px",
                                          lineHeight: "1.45",
                                          color: "var(--rose)",
                                        }}
                                      >
                                        {fm.email.err}
                                      </span>
                                    </>
                                  ) : null}
                                </label>
                              </div>
                              <label
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "500",
                                  }}
                                >
                                  Topic
                                </span>
                                <div style={{ position: "relative" }}>
                                  <select
                                    value={fm.topic.val}
                                    onChange={fm.topic.onChange}
                                    onBlur={fm.topic.onBlur}
                                    style={fm.topic.inSt}
                                  >
                                    <option value="">Choose a topic</option>
                                    {topics.map((t: any, i47: number) => (
                                      <Fragment key={i47}>
                                        <option value={t}>{t}</option>
                                      </Fragment>
                                    ))}
                                  </select>
                                  <span
                                    style={{
                                      position: "absolute",
                                      right: "14px",
                                      top: "16px",
                                      pointerEvents: "none",
                                    }}
                                  >
                                    <span style={ico.chev}></span>
                                  </span>
                                </div>
                                {fm.topic.has ? (
                                  <>
                                    <span
                                      style={{
                                        fontSize: "13px",
                                        lineHeight: "1.45",
                                        color: "var(--rose)",
                                      }}
                                    >
                                      {fm.topic.err}
                                    </span>
                                  </>
                                ) : null}
                              </label>
                              <label
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                }}
                              >
                                <span
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                  }}
                                >
                                  Message
                                  <span
                                    style={{
                                      fontFamily:
                                        "var(--font-geist-mono), ui-monospace, monospace",
                                      fontSize: "11px",
                                      fontWeight: "400",
                                      color: "var(--ink3)",
                                    }}
                                  >
                                    At least 20 characters
                                  </span>
                                </span>
                                <textarea
                                  value={fm.msg.val}
                                  onChange={fm.msg.onChange}
                                  onBlur={fm.msg.onBlur}
                                  placeholder="What can we help with?"
                                  style={fm.msg.inSt}
                                ></textarea>
                                {fm.msg.has ? (
                                  <>
                                    <span
                                      style={{
                                        fontSize: "13px",
                                        lineHeight: "1.45",
                                        color: "var(--rose)",
                                      }}
                                    >
                                      {fm.msg.err}
                                    </span>
                                  </>
                                ) : null}
                              </label>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "16px",
                                  flexWrap: "wrap",
                                  paddingTop: "4px",
                                }}
                              >
                                <button
                                  type="submit"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    height: "48px",
                                    padding: "0 24px",
                                    borderRadius: "999px",
                                    border: "none",
                                    background: "var(--btn)",
                                    color: "var(--btn-ink)",
                                    fontSize: "15px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                  }}
                                >
                                  Send message
                                </button>
                                <span
                                  style={{
                                    fontSize: "13px",
                                    color: "var(--ink3)",
                                  }}
                                >
                                  We only use your email to reply.
                                </span>
                              </div>
                            </form>
                          </>
                        ) : null}
                        {sent ? (
                          <>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                                padding: "32px 0",
                                borderTop: "1px solid var(--line)",
                                borderBottom: "1px solid var(--line)",
                              }}
                            >
                              <span
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "99px",
                                  background: "var(--green)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <span style={ico.checkInv}></span>
                              </span>
                              <span
                                style={{
                                  fontFamily:
                                    "var(--font-bricolage), var(--font-geist), sans-serif",
                                  fontWeight: "700",
                                  fontSize: "30px",
                                  letterSpacing: "-0.03em",
                                }}
                              >
                                Thanks, {sentName}.
                              </span>
                              <span
                                style={{
                                  fontSize: "17px",
                                  lineHeight: "1.55",
                                  color: "var(--ink2)",
                                }}
                              >
                                Your message is with us. We will reply to{" "}
                                {sentEmail}.
                              </span>
                              <button
                                onClick={resetForm}
                                style={{
                                  alignSelf: "flex-start",
                                  height: "40px",
                                  padding: "0 16px",
                                  borderRadius: "999px",
                                  border: "1px solid var(--line)",
                                  background: "transparent",
                                  color: "var(--ink)",
                                  fontSize: "14px",
                                  cursor: "pointer",
                                }}
                              >
                                Send another message
                              </button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            {pg.status ? (
              <>
                <section
                  style={{
                    position: "relative",
                    padding: "var(--heroT) var(--pr) 0 var(--px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(var(--tx) - 4.5px)",
                      top: "calc(var(--heroT) + 4px)",
                    }}
                  >
                    <div data-nd="k0" style={nd.k0}></div>
                  </div>
                  <div data-rv="0" style={rv.r0}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "28px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        Status · Oct 15, 2026 · 11:24 UTC
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "24px",
                        }}
                      >
                        <span style={stDot}></span>
                        {ok ? (
                          <>
                            <h1
                              style={{
                                margin: "0",
                                fontFamily:
                                  "var(--font-bricolage), var(--font-geist), sans-serif",
                                fontWeight: "700",
                                fontSize: "var(--h1)",
                                lineHeight: "0.98",
                                letterSpacing: "-0.04em",
                                textWrap: "balance",
                              }}
                            >
                              All systems{" "}
                              <em
                                style={{
                                  fontFamily:
                                    "var(--font-instrument-serif), serif",
                                  fontStyle: "italic",
                                  fontWeight: "400",
                                  fontSize: "1.1em",
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                operational
                              </em>
                              .
                            </h1>
                          </>
                        ) : null}
                        {inc ? (
                          <>
                            <h1
                              style={{
                                margin: "0",
                                fontFamily:
                                  "var(--font-bricolage), var(--font-geist), sans-serif",
                                fontWeight: "700",
                                fontSize: "var(--h1)",
                                lineHeight: "0.98",
                                letterSpacing: "-0.04em",
                                textWrap: "balance",
                              }}
                            >
                              Search is{" "}
                              <em
                                style={{
                                  fontFamily:
                                    "var(--font-instrument-serif), serif",
                                  fontStyle: "italic",
                                  fontWeight: "400",
                                  fontSize: "1.1em",
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                degraded
                              </em>
                              .
                            </h1>
                          </>
                        ) : null}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "24px 64px",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        {ok ? (
                          <>
                            <p
                              style={{
                                margin: "0",
                                maxWidth: "560px",
                                fontSize: "var(--lead)",
                                lineHeight: "1.5",
                                color: "var(--ink2)",
                              }}
                            >
                              Every live module is working normally.
                            </p>
                          </>
                        ) : null}
                        {inc ? (
                          <>
                            <p
                              style={{
                                margin: "0",
                                maxWidth: "560px",
                                fontSize: "var(--lead)",
                                lineHeight: "1.5",
                                color: "var(--ink2)",
                              }}
                            >
                              Some workspaces see slow search results.
                              Everything else is working normally.
                            </p>
                          </>
                        ) : null}
                        <a
                          href="#"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            height: "48px",
                            padding: "0 24px",
                            borderRadius: "999px",
                            background: "var(--btn)",
                            color: "var(--btn-ink)",
                            fontSize: "15px",
                            fontWeight: "500",
                            textDecoration: "none",
                          }}
                        >
                          Subscribe to updates
                        </a>
                      </div>
                    </div>
                  </div>
                </section>
                {inc ? (
                  <>
                    <section
                      style={{
                        position: "relative",
                        padding: "72px var(--pr) 0 var(--px)",
                      }}
                    >
                      <div data-rv="1" style={rv.r1}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            paddingBottom: "16px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontFamily:
                                "var(--font-geist-mono), ui-monospace, monospace",
                              fontSize: "12px",
                              letterSpacing: ".08em",
                              textTransform: "uppercase",
                              color: "var(--ink3)",
                            }}
                          >
                            Current incident
                          </span>
                          <span
                            style={{
                              fontFamily:
                                "var(--font-geist-mono), ui-monospace, monospace",
                              fontSize: "11px",
                              letterSpacing: ".06em",
                              textTransform: "uppercase",
                              color: "var(--amber)",
                              border: "1px dashed var(--amber)",
                              borderRadius: "999px",
                              padding: "2px 9px",
                            }}
                          >
                            Example
                          </span>
                        </div>
                        <div style={{ borderTop: "1px solid var(--line)" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: "16px",
                              padding: "22px 0",
                              borderBottom: "1px solid var(--line2)",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{ fontSize: "20px", fontWeight: "600" }}
                            >
                              Slow search results
                            </span>
                            <span
                              style={{
                                fontFamily:
                                  "var(--font-geist-mono), ui-monospace, monospace",
                                fontSize: "12px",
                                color: "var(--ink3)",
                              }}
                            >
                              Search · started 10:42 UTC
                            </span>
                          </div>
                          {incUpd.map((u: any, i48: number) => (
                            <Fragment key={i48}>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "var(--clCols)",
                                  gap: "8px 40px",
                                  padding: "20px 0",
                                  borderBottom: "1px solid var(--line2)",
                                  alignItems: "start",
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily:
                                      "var(--font-geist-mono), ui-monospace, monospace",
                                    fontSize: "13px",
                                    color: "var(--ink2)",
                                  }}
                                >
                                  {u.t} UTC
                                </span>
                                <span
                                  style={{
                                    fontSize: "15px",
                                    lineHeight: "1.55",
                                    maxWidth: "640px",
                                  }}
                                >
                                  {u.x}
                                </span>
                                <span style={u.st}>{u.s}</span>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    </section>
                  </>
                ) : null}
                <section
                  style={{
                    position: "relative",
                    padding: "72px var(--pr) 0 var(--px)",
                  }}
                >
                  <div data-rv="2" style={rv.r2}>
                    <span
                      style={{
                        fontFamily:
                          "var(--font-geist-mono), ui-monospace, monospace",
                        fontSize: "12px",
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: "var(--ink3)",
                      }}
                    >
                      Components
                    </span>
                    <div
                      style={{
                        marginTop: "16px",
                        borderTop: "1px solid var(--line)",
                      }}
                    >
                      {comps.map((c: any, i49: number) => (
                        <Fragment key={i49}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                              minHeight: "56px",
                              borderBottom: "1px solid var(--line2)",
                            }}
                          >
                            <span style={{ flex: "1", fontSize: "15px" }}>
                              {c.n}
                            </span>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span style={c.dot}></span>
                              <span style={c.tSt}>{c.s}</span>
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </section>
                <section
                  style={{
                    position: "relative",
                    padding: "72px var(--pr) var(--sec) var(--px)",
                  }}
                >
                  <div data-rv="3" style={rv.r3}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12px",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "var(--ink3)",
                        }}
                      >
                        Past incidents
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "11px",
                          letterSpacing: ".06em",
                          textTransform: "uppercase",
                          color: "var(--amber)",
                          border: "1px dashed var(--amber)",
                          borderRadius: "999px",
                          padding: "2px 9px",
                        }}
                      >
                        Sample
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: "16px",
                        borderTop: "1px solid var(--line)",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "var(--clCols)",
                          gap: "8px 40px",
                          padding: "20px 0",
                          borderBottom: "1px solid var(--line2)",
                          alignItems: "start",
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "13px",
                            color: "var(--ink2)",
                          }}
                        >
                          Oct 2, 2026
                        </span>
                        <span style={{ fontSize: "15px", lineHeight: "1.55" }}>
                          Saving edits in Docs was delayed for some workspaces.
                        </span>
                        <span
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "11px",
                            color: "var(--green)",
                          }}
                        >
                          Resolved
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
          </main>
        </>
      ) : null}
      {showClose ? (
        <>
          <section
            style={{
              position: "relative",
              padding: "0 var(--pr) 0 var(--px)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "0",
                bottom: "0",
                left: "30%",
                width: "140px",
                background:
                  "linear-gradient(to bottom, transparent, var(--beam) 60%, transparent)",
                pointerEvents: "none",
              }}
            ></div>
            <div
              style={{
                position: "absolute",
                top: "0",
                bottom: "0",
                left: "64%",
                width: "220px",
                background:
                  "linear-gradient(to bottom, var(--beam), transparent 90%)",
                pointerEvents: "none",
              }}
            ></div>
            <div
              style={{
                position: "absolute",
                left: "20%",
                top: "120px",
                width: "1200px",
                height: "700px",
                background:
                  "radial-gradient(closest-side, var(--halo), transparent)",
                opacity: ".6",
                pointerEvents: "none",
              }}
            ></div>
            <div
              style={{
                position: "absolute",
                left: "0",
                right: "0",
                top: "80px",
                height: "700px",
                background:
                  "radial-gradient(closest-side, var(--wash), transparent)",
                pointerEvents: "none",
              }}
            ></div>
            <div
              style={{
                position: "absolute",
                left: "calc(var(--tx) - 0.75px)",
                top: "0",
                height: "var(--sec)",
                width: "1.5px",
              }}
            >
              <div style={track}></div>
              <div style={fillEnd}></div>
            </div>
            <div
              style={{
                position: "absolute",
                left: "calc(var(--tx) - 7px)",
                top: "calc(var(--sec) - 5px)",
              }}
            >
              <div style={endNode}></div>
            </div>
            <div data-rv="12" style={rv.r12}>
              <div
                style={{
                  position: "relative",
                  padding: "var(--sec) 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "28px",
                  maxWidth: "1040px",
                }}
              >
                <span
                  style={{
                    fontFamily:
                      "var(--font-geist-mono), ui-monospace, monospace",
                    fontSize: "12px",
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "var(--ink3)",
                  }}
                >
                  Start
                </span>
                {cl.pricing ? (
                  <>
                    <h2
                      style={{
                        margin: "0",
                        fontFamily:
                          "var(--font-bricolage), var(--font-geist), sans-serif",
                        fontWeight: "700",
                        fontSize: "var(--h3)",
                        lineHeight: "0.95",
                        letterSpacing: "-0.045em",
                        textWrap: "balance",
                      }}
                    >
                      Start with the live modules{" "}
                      <em
                        style={{
                          fontFamily: "var(--font-instrument-serif), serif",
                          fontStyle: "italic",
                          fontWeight: "400",
                          fontSize: "1.1em",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        today
                      </em>
                      .
                    </h2>
                  </>
                ) : null}
                {cl.modules ? (
                  <>
                    <h2
                      style={{
                        margin: "0",
                        fontFamily:
                          "var(--font-bricolage), var(--font-geist), sans-serif",
                        fontWeight: "700",
                        fontSize: "var(--h3)",
                        lineHeight: "0.95",
                        letterSpacing: "-0.045em",
                        textWrap: "balance",
                      }}
                    >
                      Turn on the modules you{" "}
                      <em
                        style={{
                          fontFamily: "var(--font-instrument-serif), serif",
                          fontStyle: "italic",
                          fontWeight: "400",
                          fontSize: "1.1em",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        need
                      </em>
                      .
                    </h2>
                  </>
                ) : null}
                {cl.module ? (
                  <>
                    <h2
                      style={{
                        margin: "0",
                        fontFamily:
                          "var(--font-bricolage), var(--font-geist), sans-serif",
                        fontWeight: "700",
                        fontSize: "var(--h3)",
                        lineHeight: "0.95",
                        letterSpacing: "-0.045em",
                        textWrap: "balance",
                      }}
                    >
                      Turn on {md.n} in your{" "}
                      <em
                        style={{
                          fontFamily: "var(--font-instrument-serif), serif",
                          fontStyle: "italic",
                          fontWeight: "400",
                          fontSize: "1.1em",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        workspace
                      </em>
                      .
                    </h2>
                  </>
                ) : null}
                {cl.roadmap ? (
                  <>
                    <h2
                      style={{
                        margin: "0",
                        fontFamily:
                          "var(--font-bricolage), var(--font-geist), sans-serif",
                        fontWeight: "700",
                        fontSize: "var(--h3)",
                        lineHeight: "0.95",
                        letterSpacing: "-0.045em",
                        textWrap: "balance",
                      }}
                    >
                      Use what is{" "}
                      <em
                        style={{
                          fontFamily: "var(--font-instrument-serif), serif",
                          fontStyle: "italic",
                          fontWeight: "400",
                          fontSize: "1.1em",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        live
                      </em>{" "}
                      while you wait.
                    </h2>
                  </>
                ) : null}
                {cl.security ? (
                  <>
                    <h2
                      style={{
                        margin: "0",
                        fontFamily:
                          "var(--font-bricolage), var(--font-geist), sans-serif",
                        fontWeight: "700",
                        fontSize: "var(--h3)",
                        lineHeight: "0.95",
                        letterSpacing: "-0.045em",
                        textWrap: "balance",
                      }}
                    >
                      Set up your roles on day{" "}
                      <em
                        style={{
                          fontFamily: "var(--font-instrument-serif), serif",
                          fontStyle: "italic",
                          fontWeight: "400",
                          fontSize: "1.1em",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        one
                      </em>
                      .
                    </h2>
                  </>
                ) : null}
                {cl.changelog ? (
                  <>
                    <h2
                      style={{
                        margin: "0",
                        fontFamily:
                          "var(--font-bricolage), var(--font-geist), sans-serif",
                        fontWeight: "700",
                        fontSize: "var(--h3)",
                        lineHeight: "0.95",
                        letterSpacing: "-0.045em",
                        textWrap: "balance",
                      }}
                    >
                      Try what shipped this{" "}
                      <em
                        style={{
                          fontFamily: "var(--font-instrument-serif), serif",
                          fontStyle: "italic",
                          fontWeight: "400",
                          fontSize: "1.1em",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        month
                      </em>
                      .
                    </h2>
                  </>
                ) : null}
                <p
                  style={{
                    margin: "0",
                    maxWidth: "560px",
                    fontSize: "var(--lead)",
                    lineHeight: "1.5",
                    color: "var(--ink2)",
                    textWrap: "pretty",
                  }}
                >
                  {closeLead}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  <a
                    href="/auth/sign-up"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      height: "56px",
                      padding: "0 30px",
                      borderRadius: "999px",
                      background: "var(--btn)",
                      color: "var(--btn-ink)",
                      fontSize: "16px",
                      fontWeight: "500",
                      textDecoration: "none",
                    }}
                  >
                    Start free
                  </a>
                  <a
                    href={hrefOf(close2.go)}
                    onClick={close2.go}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      height: "56px",
                      padding: "0 26px",
                      borderRadius: "999px",
                      border: "1px solid var(--line)",
                      color: "var(--ink)",
                      fontSize: "16px",
                      fontWeight: "500",
                      textDecoration: "none",
                    }}
                  >
                    {close2.t}
                  </a>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
      {showFooter ? (
        <>
          <footer
            style={{
              position: "relative",
              borderTop: "1px solid var(--line2)",
              padding: "56px var(--pr) 48px var(--px)",
              display: "grid",
              gridTemplateColumns: "var(--ftCols)",
              gap: "44px 40px",
            }}
          >
            <div
              style={{
                gridColumn: "var(--ftSpan)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minWidth: "0",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "7px",
                    background: "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      width: "2px",
                      height: "12px",
                      borderRadius: "2px",
                      background: "var(--accent)",
                    }}
                  ></span>
                </span>
                <span
                  style={{
                    fontFamily:
                      "var(--font-bricolage), var(--font-geist), sans-serif",
                    fontWeight: "700",
                    fontSize: "20px",
                    letterSpacing: "-0.04em",
                  }}
                >
                  Zentro
                </span>
              </div>
              <span style={{ fontSize: "14px", color: "var(--ink2)" }}>
                The operating system for startups.
              </span>
              <a
                href={hrefOf(go.status)}
                onClick={go.status}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontSize: "12px",
                  color: "var(--ink2)",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "99px",
                    background: "var(--green)",
                  }}
                ></span>
                All systems operational
              </a>
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontSize: "11px",
                  color: "var(--ink3)",
                }}
              >
                © 2026 Zentro
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "14px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontSize: "11px",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: "var(--ink3)",
                }}
              >
                Product
              </span>
              <a href="/" style={{ color: "var(--ink2)" }}>
                Overview
              </a>
              {footProduct.map((l: any, i50: number) => (
                <Fragment key={i50}>
                  <a
                    href={hrefOf(l.go)}
                    onClick={l.go}
                    style={{ color: "var(--ink2)" }}
                  >
                    {l.t}
                  </a>
                </Fragment>
              ))}
            </div>
            <div
              style={{
                gridColumn: "var(--ftSpan)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                minWidth: "0",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontSize: "11px",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: "var(--ink3)",
                }}
              >
                Modules
              </span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px 16px",
                  fontSize: "14px",
                }}
              >
                {footLive.map((l: any, i51: number) => (
                  <Fragment key={i51}>
                    <a
                      href={hrefOf(l.go)}
                      onClick={l.go}
                      style={{ color: "var(--ink)" }}
                    >
                      {l.t}
                    </a>
                  </Fragment>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px 16px",
                  fontSize: "14px",
                  color: "var(--ink3)",
                  opacity: ".7",
                }}
              >
                {footSoon.map((x: any, i52: number) => (
                  <Fragment key={i52}>
                    <span>{x}</span>
                  </Fragment>
                ))}
                <a
                  href={hrefOf(go.roadmap)}
                  onClick={go.roadmap}
                  style={{
                    fontFamily:
                      "var(--font-geist-mono), ui-monospace, monospace",
                    fontSize: "11px",
                    color: "var(--ink3)",
                    alignSelf: "center",
                  }}
                >
                  coming · roadmap
                </a>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "14px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontSize: "11px",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: "var(--ink3)",
                }}
              >
                Company
              </span>
              {footCompany.map((l: any, i53: number) => (
                <Fragment key={i53}>
                  <a
                    href={hrefOf(l.go)}
                    onClick={l.go}
                    style={{ color: "var(--ink2)" }}
                  >
                    {l.t}
                  </a>
                </Fragment>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "14px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontSize: "11px",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: "var(--ink3)",
                }}
              >
                Legal
              </span>
              {footLegal.map((l: any, i54: number) => (
                <Fragment key={i54}>
                  <a
                    href={hrefOf(l.go)}
                    onClick={l.go}
                    style={{ color: "var(--ink2)" }}
                  >
                    {l.t}
                  </a>
                </Fragment>
              ))}
            </div>
            <div
              style={{
                gridColumn: "var(--ftSpan)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontSize: "11px",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: "var(--ink3)",
                }}
              >
                Theme
              </span>
              <div
                style={{
                  display: "flex",
                  gap: "2px",
                  padding: "3px",
                  border: "1px solid var(--line)",
                  borderRadius: "999px",
                  alignSelf: "flex-start",
                }}
              >
                <button
                  style={th.light}
                  onClick={setLight}
                  aria-label="Light theme"
                  title="Light"
                >
                  <span style={thIc.light}></span>
                </button>
                <button
                  style={th.dark}
                  onClick={setDark}
                  aria-label="Dark theme"
                  title="Dark"
                >
                  <span style={thIc.dark}></span>
                </button>
                <button
                  style={th.sys}
                  onClick={setSys}
                  aria-label="System theme"
                  title="System"
                >
                  <span style={thIc.sys}></span>
                </button>
              </div>
            </div>
          </footer>
        </>
      ) : null}
    </div>
  );
}
