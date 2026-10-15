/* eslint-disable @typescript-eslint/no-explicit-any */
// Content and design tokens for the marketing site pages (ported from the Zentro Site Page design).
import type { CSSProperties } from "react";

export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const DARK: Record<string, string> = {
  "--bg": "#0a0a0f",
  "--band": "#0c0c13",
  "--tile": "#111118",
  "--tile2": "#17171f",
  "--line": "#25253a",
  "--line2": "#1a1a29",
  "--ink": "#f3f2f8",
  "--ink2": "#a6a5bb",
  "--ink3": "#6e6d86",
  "--accent": "#9b7fff",
  "--btn": "#9b7fff",
  "--btnInk": "#0a0a0f",
  "--navBg": "rgba(10,10,15,.72)",
  "--halo": "rgba(123,92,255,.40)",
  "--beam": "rgba(155,127,255,.06)",
  "--wash": "transparent",
  "--track": "rgba(155,127,255,.30)",
  "--glow": "0 0 12px rgba(155,127,255,.65)",
  "--glass":
    "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,0) 45%)",
  "--sky": "rgba(220,235,255,.14)",
  "--lav": "rgba(233,228,255,.14)",
  "--peach": "rgba(255,230,210,.14)",
  "--mint": "rgba(216,243,230,.14)",
  "--rosep": "rgba(255,221,228,.14)",
  "--chipBg": "rgba(255,255,255,.06)",
  "--amber": "#f5b84a",
  "--cyan": "#56d4e6",
  "--green": "#57d98a",
  "--rose": "#fb7a8e",
  "--shadow": "none",
  "--frame": "#0e0e15",
};
export const LIGHT: Record<string, string> = {
  "--bg": "#f6f5f1",
  "--band": "#efede7",
  "--tile": "#ffffff",
  "--tile2": "#f8f7f3",
  "--line": "#e4e1d9",
  "--line2": "#ece9e2",
  "--ink": "#141318",
  "--ink2": "#5d5b67",
  "--ink3": "#8f8c98",
  "--accent": "#5b3fe0",
  "--btn": "#141318",
  "--btnInk": "#ffffff",
  "--navBg": "rgba(246,245,241,.82)",
  "--halo": "rgba(91,63,224,.18)",
  "--beam": "transparent",
  "--wash": "rgba(233,228,255,.8)",
  "--track": "rgba(91,63,224,.32)",
  "--glow": "0 0 8px rgba(91,63,224,.35)",
  "--glass": "none",
  "--sky": "#dcebff",
  "--lav": "#e9e4ff",
  "--peach": "#ffe6d2",
  "--mint": "#d8f3e6",
  "--rosep": "#ffdde4",
  "--chipBg": "rgba(255,255,255,.75)",
  "--amber": "#b36a00",
  "--cyan": "#08819e",
  "--green": "#178a45",
  "--rose": "#d6284f",
  "--shadow":
    "0 1px 2px rgba(20,19,24,.04), 0 16px 36px -18px rgba(20,19,24,.14)",
  "--frame": "#ffffff",
};
export const LD: Record<string, string> = {
  "--px": "128px",
  "--pr": "64px",
  "--tx": "64px",
  "--h1": "80px",
  "--h2": "56px",
  "--h3": "96px",
  "--lead": "19px",
  "--sec": "160px",
  "--navPL": "53px",
  "--heroT": "120px",
  "--plCols": "repeat(3,minmax(0,1fr))",
  "--cmpCols": "minmax(0,1.6fr) repeat(3,minmax(0,1fr))",
  "--cmpJ": "center",
  "--cmpTA": "center",
  "--adCols": "minmax(0,1fr) 380px",
  "--faqCols": "minmax(0,4fr) minmax(0,7fr)",
  "--gCols": "192px minmax(0,1fr)",
  "--mrCols": "32px minmax(0,1fr) 86px 96px",
  "--mnW": "200px",
  "--mlD": "flex",
  "--repPL": "224px",
  "--shotCols": "200px minmax(0,1fr)",
  "--sbD": "block",
  "--shotH": "500px",
  "--shotP": "26px",
  "--two": "minmax(0,1fr) minmax(0,1fr)",
  "--dhCols": "minmax(0,2.2fr) minmax(0,1fr) 70px 150px",
  "--lkCols": "minmax(0,4fr) minmax(0,7fr)",
  "--mxCols": "minmax(0,1.7fr) repeat(4,minmax(0,1fr))",
  "--lkRow": "32px minmax(0,1fr) 86px",
  "--rmCols": "minmax(0,5fr) minmax(0,6fr)",
  "--rlCols": "repeat(4,minmax(0,1fr))",
  "--chCols": "repeat(5,minmax(0,1fr))",
  "--auCols": "150px 140px minmax(0,1fr) 110px",
  "--clCols": "180px minmax(0,1fr) 120px",
  "--lgCols": "220px minmax(0,720px)",
  "--tocD": "flex",
  "--tocM": "none",
  "--fmCols": "minmax(0,1fr) minmax(0,1fr)",
  "--abCols": "240px minmax(0,1fr)",
  "--stCols": "minmax(0,1fr) auto",
  "--ftCols":
    "minmax(0,1.3fr) minmax(0,.7fr) minmax(0,1.7fr) minmax(0,.7fr) minmax(0,.7fr) auto",
  "--ftSpan": "auto",
};
export const LM: Record<string, string> = {
  "--px": "44px",
  "--pr": "20px",
  "--tx": "20px",
  "--h1": "46px",
  "--h2": "34px",
  "--h3": "50px",
  "--lead": "17px",
  "--sec": "96px",
  "--navPL": "9px",
  "--heroT": "72px",
  "--plCols": "minmax(0,1fr)",
  "--cmpCols": "minmax(0,1.5fr) minmax(0,1fr)",
  "--cmpJ": "flex-end",
  "--cmpTA": "right",
  "--adCols": "minmax(0,1fr)",
  "--faqCols": "minmax(0,1fr)",
  "--gCols": "minmax(0,1fr)",
  "--mrCols": "32px minmax(0,1fr) auto",
  "--mnW": "100%",
  "--mlD": "none",
  "--repPL": "0px",
  "--shotCols": "minmax(0,1fr)",
  "--sbD": "none",
  "--shotH": "420px",
  "--shotP": "16px",
  "--two": "minmax(0,1fr)",
  "--dhCols": "minmax(0,1fr) 92px",
  "--lkCols": "minmax(0,1fr)",
  "--mxCols": "minmax(0,1.4fr) repeat(4,minmax(0,1fr))",
  "--lkRow": "32px minmax(0,1fr) auto",
  "--rmCols": "minmax(0,1fr)",
  "--rlCols": "minmax(0,1fr)",
  "--chCols": "minmax(0,1fr)",
  "--auCols": "minmax(0,1fr)",
  "--clCols": "minmax(0,1fr)",
  "--lgCols": "minmax(0,1fr)",
  "--tocD": "none",
  "--tocM": "block",
  "--fmCols": "minmax(0,1fr)",
  "--abCols": "minmax(0,1fr)",
  "--stCols": "minmax(0,1fr)",
  "--ftCols": "minmax(0,1fr) minmax(0,1fr)",
  "--ftSpan": "1 / -1",
};
export const IC: Record<string, string> = {
  today:
    "<circle cx='12' cy='12' r='8'/><circle cx='12' cy='12' r='2.5' fill='black'/>",
  tasks:
    "<rect x='4' y='4' width='16' height='16' rx='4'/><path d='M8.5 12.5l2.5 2.5 4.5-5'/>",
  projects:
    "<rect x='4' y='4' width='7' height='7' rx='2'/><rect x='13' y='4' width='7' height='7' rx='2'/><rect x='4' y='13' width='7' height='7' rx='2'/><rect x='13' y='13' width='7' height='7' rx='2'/>",
  docs: "<path d='M7 3.5h7l4 4v13H6v-17z'/><path d='M9 12h6M9 16h4'/>",
  team: "<circle cx='9' cy='9' r='3.2'/><circle cx='16.5' cy='10' r='2.5'/><path d='M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M15 14.6c2.3-.3 4.2.9 5 3.4'/>",
  search: "<circle cx='11' cy='11' r='6.5'/><path d='M16 16l4 4'/>",
  plus: "<path d='M12 5v14M5 12h14'/>",
  chev: "<path d='M7 10l5 5 5-5'/>",
  check: "<path d='M5 12.5l4.5 4.5L19 7.5'/>",
  bell: "<path d='M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z'/><path d='M10 20.5h4'/>",
  link: "<path d='M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1'/><path d='M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'/>",
  bold: "<path d='M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z'/>",
  italic: "<path d='M10 5h8M6 19h8M14 5l-4 14'/>",
  bullets:
    "<circle cx='5' cy='7' r='1' fill='black'/><circle cx='5' cy='12' r='1' fill='black'/><circle cx='5' cy='17' r='1' fill='black'/><path d='M9 7h11M9 12h11M9 17h11'/>",
  checklist:
    "<rect x='3.5' y='4.5' width='6' height='6' rx='1.5'/><path d='M5 7.5l1 1 2-2M13 7.5h8M13 16.5h8'/><rect x='3.5' y='13.5' width='6' height='6' rx='1.5'/>",
  code: "<path d='M8 7l-5 5 5 5M16 7l5 5-5 5'/>",
  x: "<path d='M6 6l12 12M18 6L6 18'/>",
  menu: "<path d='M4 8h16M4 16h16'/>",
  list: "<path d='M4 6h16M4 12h16M4 18h16'/>",
  board:
    "<rect x='3.5' y='4' width='5' height='16' rx='1.5'/><rect x='10.5' y='4' width='5' height='11' rx='1.5'/><rect x='17.5' y='4' width='3' height='7' rx='1'/>",
  sun: "<circle cx='12' cy='12' r='4'/><path d='M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'/>",
  moon: "<path d='M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z'/>",
  monitor:
    "<rect x='3.5' y='4.5' width='17' height='11.5' rx='2.5'/><path d='M9 20h6M12 16v4'/>",
  arrowR: "<path d='M5 12h14M13 6l6 6-6 6'/>",
  fwd: "<path d='M9 6l6 6-6 6'/>",
  alert: "<circle cx='12' cy='12' r='8.5'/><path d='M12 7.5v5.5M12 16.2v.3'/>",
};
const URL_: Record<string, string> = {};
Object.keys(IC).forEach((k) => {
  URL_[k] =
    `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>${IC[k]}</svg>`)}")`;
});
export const ic = (n: string, s = 16, c = "currentColor"): CSSProperties => ({
  width: s,
  height: s,
  flex: "none",
  display: "inline-block",
  backgroundColor: c,
  WebkitMaskImage: URL_[n],
  maskImage: URL_[n],
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
});
export const mono = "var(--font-geist-mono), ui-monospace, monospace";
export const TINT: Record<string, string> = {
  Work: "var(--sky)",
  Knowledge: "var(--lav)",
  Talk: "var(--peach)",
  Company: "var(--mint)",
};
export const GROUPS = ["Work", "Knowledge", "Talk", "Company"];
export const MODS: Array<[string, string, string, number, string]> = [
  [
    "Projects",
    "Pr",
    "Work",
    1,
    "Plan work in projects with owners, milestones and status.",
  ],
  [
    "Tasks",
    "Ta",
    "Work",
    1,
    "Keys, states, assignees, due dates and a timer on every task.",
  ],
  ["Dashboards", "Db", "Work", 0, "Charts built from your projects and tasks."],
  ["Forms", "Fm", "Work", 0, "Collect requests that turn into tasks."],
  [
    "Docs",
    "Dc",
    "Knowledge",
    1,
    "Specs and notes that link to the tasks they describe.",
  ],
  ["Files", "Fl", "Knowledge", 0, "Store a file once and attach it anywhere."],
  ["Chat", "Ch", "Talk", 0, "Channels and threads next to the work."],
  ["Meetings", "Mt", "Talk", 0, "Agendas and notes that turn into tasks."],
  ["Mail", "Ml", "Talk", 0, "Shared inboxes inside the workspace."],
  ["Calendar", "Ca", "Talk", 0, "Team calendars tied to due dates."],
  [
    "Tickets",
    "Tk",
    "Talk",
    0,
    "Support requests linked to the tasks that fix them.",
  ],
  ["Teams", "Te", "Company", 1, "Group people and set who works on what."],
  [
    "Roles & permissions",
    "Ro",
    "Company",
    1,
    "One role model across every module.",
  ],
  ["Audit log", "Au", "Company", 1, "Every change, who made it and when."],
  ["Modules", "Mo", "Company", 1, "Turn modules on or off for the whole org."],
  [
    "Admin",
    "Ad",
    "Company",
    0,
    "Org settings, domains and members in one place.",
  ],
  ["HR", "HR", "Company", 0, "Employee records, time off and onboarding."],
  ["Payroll", "Py", "Company", 0, "Run pay from the same employee records."],
];
export const MODBY: Record<string, (typeof MODS)[number]> = Object.fromEntries(
  MODS.map((x) => [x[0], x]),
);
export const PPL: Record<string, [string, string]> = {
  PR: ["Priya Raman", "var(--lav)"],
  AM: ["Arjun Mehta", "var(--sky)"],
  MI: ["Meera Iyer", "var(--peach)"],
  TB: ["Tom Becker", "var(--mint)"],
  LH: ["Lena Hoffmann", "var(--rosep)"],
};
export const PLANS = [
  ["[Plan A]", "For a small team trying Zentro for the first time."],
  ["[Plan B]", "For teams that run most of their work in Zentro."],
  ["[Plan C]", "For companies with more people, guests and support needs."],
];
export const COMPARE = [
  [
    "Live modules",
    "Projects, Tasks, Docs, Teams, Roles, Audit log, Modules",
    ["y", "y", "y"],
  ],
  ["One search across modules", "", ["y", "y", "y"]],
  ["Roles: Owner, Admin, Member, Guest", "", ["y", "y", "y"]],
  ["Audit log", "", ["y", "y", "y"]],
  ["Members per workspace", "", ["tbd", "tbd", "tbd"]],
  ["Guests", "", ["tbd", "tbd", "tbd"]],
  ["Audit log history", "", ["tbd", "tbd", "tbd"]],
  ["Coming modules", "When they ship", ["Add-on", "Add-on", "Add-on"]],
  ["Support", "", ["tbd", "tbd", "tbd"]],
];
export const FAQ = [
  [
    "Are these prices final?",
    "No. The plan names, prices and limits on this page are placeholders. This page will change before pricing is published.",
  ],
  [
    "What does every plan include?",
    "All seven live modules: Projects, Tasks, Docs, Teams, Roles & permissions, Audit log and Modules. Every plan uses the same permission system and the same search.",
  ],
  [
    "Can I start without choosing a plan?",
    "Yes. Start free gives you a workspace with the live modules. What the free start includes over time is not decided yet.",
  ],
  [
    "What happens when a coming module ships?",
    "Under the add-on idea above, you could add it to any plan for a per-person price, or leave it off. Nothing changes in your workspace until an Owner turns it on.",
  ],
  [
    "Can I turn modules off?",
    "Yes. Owners turn modules on or off for the whole workspace. Zentro asks first when another module depends on the one you are turning off.",
  ],
  [
    "How are people counted?",
    "This is not decided yet. Guests may be counted differently from members.",
  ],
];
export const MD: Record<string, any> = {
  tasks: {
    n: "Tasks",
    code: "Ta",
    group: "Work",
    h1a: "Tasks that know where they ",
    h1em: "came",
    h1b: " from.",
    lead: "Every task has a key, a state, an assignee, a due date and a timer. It links to its project, its doc and the people on it, and every change goes to the audit log.",
    url1: "northwind.zentro.app / tasks",
    url2: "northwind.zentro.app / tasks / ZEN-18",
    url3: "northwind.zentro.app / today",
    s1t: "Task list",
    s1d: "Grouped by state. Filter by project or person, or switch to a board.",
    s2t: "Task detail",
    s2d: "Properties at the top and every linked item down the Thread.",
    s3t: "Today",
    s3d: "Your focus task with its timer, and what is up next.",
    links: [
      [
        "Projects",
        1,
        "Every task belongs to a project and takes its key from it, like ZEN-18. Project access decides who sees the task.",
      ],
      [
        "Docs",
        1,
        "Link the spec a task was written from. The doc lists every task that points to it.",
      ],
      ["Teams", 1, "Assign tasks to people and filter the list by team."],
      [
        "Roles & permissions",
        1,
        "Who can create, assign and edit tasks comes from the workspace roles.",
      ],
      [
        "Audit log",
        1,
        "State changes, reassignments and edits are written to the log.",
      ],
      ["Files", 0, "Attach a file once and see it on every task that uses it."],
      ["Chat", 0, "Link the message that changed a task."],
      ["Tickets", 0, "Link the support ticket a task fixes."],
    ],
    perms: [
      ["view", [2, 2, 2, 3]],
      ["create", [2, 2, 2, 0]],
      ["edit", [2, 2, 1, 0]],
      ["assign others", [2, 2, 2, 0]],
      ["delete", [2, 2, 1, 0]],
    ],
    closeLead:
      "Tasks is live today, with Projects, Docs, Teams, roles and the audit log.",
  },
  docs: {
    n: "Docs",
    code: "Dc",
    group: "Knowledge",
    h1a: "Docs that link to the ",
    h1em: "work",
    h1b: " they describe.",
    lead: "Write specs, decisions and notes next to the tasks they belong to. A doc shows its linked tasks, follows its project’s access, and every edit and share goes to the audit log.",
    url1: "northwind.zentro.app / docs",
    url2: "northwind.zentro.app / docs / session-handling-spec",
    url3: "northwind.zentro.app / docs / share",
    s1t: "Docs home",
    s1d: "Every doc with its project, linked tasks and last edit.",
    s2t: "Doc editor",
    s2d: "Headings, checklists and code, with linked tasks under the text.",
    s3t: "Sharing",
    s3d: "Share with a team or a person. Sharing outside the org follows the roles.",
    links: [
      [
        "Tasks",
        1,
        "Link a doc to the tasks it describes. Each task shows the doc it came from.",
      ],
      ["Projects", 1, "A doc lives in a project and follows its access."],
      ["Teams", 1, "Share a doc with a whole team in one step."],
      [
        "Roles & permissions",
        1,
        "Viewing, editing and sharing outside the org follow the workspace roles.",
      ],
      [
        "Audit log",
        1,
        "Edits, shares and permission changes are written to the log.",
      ],
      ["Files", 0, "Embed a stored file in a doc without uploading a copy."],
      ["Meetings", 0, "Turn meeting notes into a doc."],
      ["Chat", 0, "Link the thread a decision came from."],
    ],
    perms: [
      ["view", [2, 2, 2, 3]],
      ["create", [2, 2, 2, 0]],
      ["edit", [2, 2, 2, 3]],
      ["share outside org", [2, 2, 0, 0]],
      ["delete", [2, 2, 1, 0]],
    ],
    closeLead:
      "Docs is live today, with Projects, Tasks, Teams, roles and the audit log.",
  },
};
export const TL = [
  [
    "prog",
    "In progress",
    [
      [
        "ZEN-18",
        "Fix login redirect loop on expired sessions",
        "PR",
        "Tomorrow",
      ],
      ["BIL-7", "Migrate invoices table to integer cents", "AM", "Oct 11", 1],
      ["ONB-12", "Write welcome email copy", "MI", "Oct 17"],
    ],
  ],
  [
    "review",
    "In review",
    [
      ["BIL-4", "Proration rules for mid-cycle upgrades", "AM", "Oct 14"],
      ["ZEN-15", "Empty states for Docs home", "PR", "Oct 20"],
    ],
  ],
  [
    "todo",
    "To do",
    [
      ["ONB-14", "Invite teammates step", "MI", "Oct 12", 1],
      ["ZEN-24", "Rate-limit the invite endpoint", "TB", "Oct 15"],
      ["ONB-9", "Checklist progress on Today", "MI", "Oct 22"],
    ],
  ],
];
export const PROJ: Record<string, string> = {
  ZEN: "Zentro Web",
  BIL: "Billing",
  ONB: "Onboarding",
};
export const ROLES = [
  [
    "Owner",
    "Everything, including roles, billing and turning modules on or off.",
  ],
  [
    "Admin",
    "Manages members and teams, shares docs outside the org and reads the audit log.",
  ],
  ["Member", "Creates and edits work in the projects they can see."],
  ["Guest", "Sees only the projects and docs shared with them."],
];
export const MATRIX = [
  ["Projects", "view", [2, 2, 2, 3]],
  ["Projects", "edit", [2, 2, 1, 0]],
  ["Tasks", "create", [2, 2, 2, 0]],
  ["Tasks", "assign others", [2, 2, 2, 0]],
  ["Docs", "edit", [2, 2, 2, 3]],
  ["Docs", "share outside org", [2, 2, 0, 0]],
  ["Teams", "manage members", [2, 2, 0, 0]],
  ["Roles", "change", [2, 0, 0, 0]],
  ["Audit log", "view", [2, 2, 0, 0]],
  ["Modules", "turn on or off", [2, 0, 0, 0]],
];
export const CHAIN = [
  [
    "Workspace role",
    "Owner, Admin, Member or Guest. It sets what a person can do in every module.",
  ],
  [
    "Project access",
    "A project decides who can see it. Its tasks and docs inherit that access.",
  ],
  [
    "Item sharing",
    "Share one doc or task with a guest. They get that item and nothing else.",
  ],
  [
    "Search",
    "Search returns only what you are allowed to see, in every module.",
  ],
  ["Audit log", "Each change above is written to the log."],
];
export const AUDIT = [
  [
    "Oct 14 · 11:20",
    "Mira Okafor",
    "shared “Onboarding checklist v2 — spec” with Growth team",
    "Docs",
  ],
  [
    "Oct 14 · 11:02",
    "Tomás Reyes",
    "invited 2 guests to Onboarding v2",
    "Teams",
  ],
  [
    "Oct 14 · 10:31",
    "Priya Shah",
    "removed “Modules · turn on or off” from Admin",
    "Roles",
  ],
  ["Oct 14 · 10:05", "Mira Okafor", "moved ZEN-142 to In progress", "Tasks"],
  ["Oct 14 · 09:40", "Jonas Lind", "turned on Tasks for Fernway", "Modules"],
  ["Oct 14 · 09:12", "Priya Shah", "gave Member edit access to Docs", "Roles"],
];
export const CL = [
  [
    "Oct 13, 2026",
    "Docs follow workspace roles",
    "Viewing, editing and sharing a doc now use the same roles as every other module. Only Owners and Admins can share a doc outside the org.",
    "Docs",
  ],
  [
    "Oct 8, 2026",
    "Focus timer on Today",
    "Start a timer on any task from Today. Tracked time shows on the task and on your day.",
    "Tasks",
  ],
  [
    "Oct 1, 2026",
    "Module dependencies",
    "Turning off a module that another one needs now asks first. For example, Tasks needs Projects.",
    "Modules",
  ],
  [
    "Sep 24, 2026",
    "Invite with a role and team",
    "Invite people by email and set their role and team in the same step.",
    "Teams",
  ],
  [
    "Sep 17, 2026",
    "Command palette",
    "Press ⌘K to search tasks, docs and people, or jump to any page.",
    "Workspace",
  ],
  [
    "Sep 10, 2026",
    "Filter the audit log",
    "Filter entries by person, module and date range.",
    "Audit log",
  ],
  [
    "Sep 2, 2026",
    "Bulk edit tasks",
    "Select several tasks to change their state, assignee or due date at once.",
    "Tasks",
  ],
  [
    "Aug 26, 2026",
    "Project keys",
    "Each project gets a short key, and its tasks are numbered from it, like ZEN-18.",
    "Projects",
  ],
  [
    "Aug 19, 2026",
    "Guest role",
    "Invite people from outside the company as Guests. They see only what is shared with them.",
    "Roles",
  ],
];
export const CLCHIP: Record<string, string | null> = {
  Docs: "Knowledge",
  Tasks: "Work",
  Projects: "Work",
  Modules: "Company",
  Teams: "Company",
  "Audit log": "Company",
  Roles: "Company",
  Workspace: null,
};
export const LOREM = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Maecenas faucibus mollis interdum. Donec ullamcorper nulla non metus auctor fringilla, vestibulum id ligula porta felis euismod semper.",
  "Curabitur blandit tempus porttitor. Nullam quis risus eget urna mollis ornare vel eu leo. Cras mattis consectetur purus sit amet fermentum. Aenean lacinia bibendum nulla sed consectetur, sed posuere consectetur est at lobortis.",
  "Etiam porta sem malesuada magna mollis euismod. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Praesent commodo cursus magna, vel scelerisque nisl consectetur et.",
];
export const LEGAL: Record<
  string,
  { tab: string; pre: string; em: string; post: string; secs: string[] }
> = {
  privacy: {
    tab: "Privacy",
    pre: "Privacy ",
    em: "policy",
    post: ".",
    secs: [
      "Who we are",
      "What we collect",
      "How we use it",
      "Who we share it with",
      "How long we keep it",
      "Your rights",
      "Cookies",
      "Contact",
    ],
  },
  terms: {
    tab: "Terms",
    pre: "Terms of ",
    em: "service",
    post: ".",
    secs: [
      "Agreement",
      "Your account",
      "Acceptable use",
      "Plans and payment",
      "Ending the agreement",
      "Liability",
      "Changes to these terms",
      "Contact",
    ],
  },
  cookies: {
    tab: "Cookies",
    pre: "Cookie ",
    em: "policy",
    post: ".",
    secs: [
      "What cookies are",
      "Cookies we use",
      "Managing cookies",
      "Changes to this policy",
      "Contact",
    ],
  },
};
export const PREV: Record<string, string[][]> = {
  Dashboards: [
    ["Open tasks by project", "Bar chart"],
    ["Overdue this week", "Number"],
    ["Done per person", "Table"],
  ],
  Forms: [
    ["Bug report", "Creates a task in Zentro Web"],
    ["Access request", "Goes to Admins"],
    ["Time off request", "Goes to HR"],
  ],
  Files: [
    ["checklist-flow-v3.pdf", "4.2 MB · ZEN-142"],
    ["brand-kit.zip", "18 MB · Marketing"],
    ["q4-plan.xlsx", "96 KB · Company"],
  ],
  Chat: [
    ["#onboarding", "Can we skip step 4 for invited users?"],
    ["#eng", "Deploying the session fix at 3pm."],
    ["#general", "Office closed on Friday."],
  ],
  Meetings: [
    ["Product sync", "Oct 13 · 25 min · 3 tasks"],
    ["Hiring review", "Oct 14 · 40 min"],
    ["Weekly planning", "Oct 16 · 30 min"],
  ],
  Mail: [
    ["support@", "Invoice question from a customer"],
    ["hello@", "Partnership enquiry"],
    ["jobs@", "Application: product designer"],
  ],
  Calendar: [
    ["Release onboarding v2", "Oct 18 · from ZEN-142"],
    ["Product sync", "Thu 10:00"],
    ["Q4 planning", "Oct 28"],
  ],
  Tickets: [
    ["SUP-88", "Invited users see an empty checklist"],
    ["SUP-91", "Export button missing on mobile"],
    ["SUP-93", "Wrong time zone on due dates"],
  ],
  Admin: [
    ["Workspace name", "Fernway"],
    ["Domains", "fernway.com"],
    ["Billing contact", "Owner"],
  ],
  HR: [
    ["Mira Okafor", "Product · Growth team"],
    ["Jonas Lind", "Design · Growth team"],
    ["Time off", "2 requests waiting"],
  ],
  Payroll: [
    ["October run", "Draft · 24 people"],
    ["September run", "Paid"],
    ["Payslips", "From HR records"],
  ],
};
export const COMP = [
  "Web app",
  "Sign-in",
  "Search",
  "Projects",
  "Tasks",
  "Docs",
  "Teams",
  "Roles & permissions",
  "Audit log",
  "Email notifications",
];
export const INC = [
  [
    "11:20",
    "Monitoring",
    "A fix is live and search results load normally for most workspaces. We are watching it.",
  ],
  [
    "10:58",
    "Identified",
    "One search index node is slow to respond. We are moving traffic to healthy nodes.",
  ],
  [
    "10:42",
    "Investigating",
    "Search results are slow to load for some workspaces. Other modules are not affected.",
  ],
];
export const TOPICS = [
  "Sales",
  "Support",
  "Security",
  "Billing",
  "Press",
  "Other",
];
