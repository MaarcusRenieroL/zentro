// Static marketing copy and layout data for the landing page. Product truth:
// only Projects, Tasks, Teams, Docs, Roles & permissions, Audit log and
// Modules are live; everything else is shown as coming.

export const KEYS = [
  "hero",
  "s2a",
  "s2b",
  "s2c",
  "s3a",
  "s3b",
  "s4",
  "s5",
  "s5x",
  "s6a",
  "s6b",
  "s6c",
] as const;

export type ThreadKey = (typeof KEYS)[number];

// Segments that draw horizontally, and from which side.
export const HORIZONTAL: Partial<Record<ThreadKey, "left" | "right">> = {
  s2b: "left",
  s3b: "right",
  s5x: "left",
  s6b: "left",
};

// name, width, scattered x, scattered y, rotation
export const CHIPS: Array<[string, number, number, number, number]> = [
  ["tracker", 85, 10, 20, -8],
  ["wiki", 61, 210, 0, 6],
  ["drive", 69, 330, 60, -4],
  ["chat", 61, 60, 120, 10],
  ["mail", 61, 250, 130, -12],
  ["calendar", 92, 0, 250, 5],
  ["HR", 46, 180, 230, -6],
  ["payroll", 85, 300, 280, 8],
  ["support", 85, 80, 340, -5],
  ["forms", 69, 260, 360, 12],
];

export type Attachment = {
  icon: string;
  tint: string;
  kind: string;
  title: string;
  meta: string;
  caption: string;
  live: boolean;
};

export const ATTACHMENTS: Attachment[] = [
  {
    icon: "Dc",
    tint: "var(--lav)",
    kind: "Doc",
    title: "Onboarding checklist v2 — spec",
    meta: "Docs · edited 2h ago by Priya Shah",
    caption: "The spec the task was written from.",
    live: true,
  },
  {
    icon: "Fl",
    tint: "var(--sky)",
    kind: "File",
    title: "checklist-flow-v3.pdf",
    meta: "4.2 MB · uploaded by Jonas Lind",
    caption: "The design file, one version for everyone.",
    live: false,
  },
  {
    icon: "Ch",
    tint: "var(--peach)",
    kind: "Chat message",
    title: "“Can we skip step 4 for invited users?”",
    meta: "#onboarding · Jonas Lind · Oct 12",
    caption: "The message that changed the scope.",
    live: false,
  },
  {
    icon: "Mt",
    tint: "var(--mint)",
    kind: "Meeting note",
    title: "Product sync — ship v2 behind a flag",
    meta: "Meetings · Oct 13 · 25 min",
    caption: "Where the decision was made.",
    live: false,
  },
  {
    icon: "Tk",
    tint: "var(--rosep)",
    kind: "Support ticket",
    title: "SUP-88 · Invited users see an empty checklist",
    meta: "Tickets · High · Oct 11",
    caption: "The ticket that started it.",
    live: false,
  },
];

type Preview = Array<[string, string, string, string]>;

export const PREVIEWS: Record<string, Preview> = {
  proj: [
    ["Onboarding v2", "12 tasks", "In progress", "var(--amber)"],
    ["Docs permissions", "8 tasks", "In review", "var(--cyan)"],
    ["Roles migration", "6 tasks", "Done", "var(--green)"],
  ],
  roles: [
    ["Owner", "2 people", "Everything", ""],
    ["Admin", "3 people", "Manage modules", ""],
    ["Member", "14 people", "Own work", ""],
    ["Guest", "5 people", "Shared items", ""],
  ],
  docs: [
    ["Onboarding checklist v2 — spec", "ZEN-142", "Edited 2h ago", ""],
    ["Q4 hiring plan", "ZEN-120", "Shared with Guests", ""],
  ],
};

// name, monogram, line, live, desktop columns, desktop rows, mobile columns, preview, tint override
export type ModuleTile = [
  string,
  string,
  string,
  boolean,
  number,
  number,
  number,
  string?,
  string?,
];

export const GROUPS: Array<[string, string, ModuleTile[]]> = [
  [
    "Work",
    "var(--sky)",
    [
      [
        "Projects",
        "Pr",
        "Plan work in projects with owners, milestones and status.",
        true,
        6,
        2,
        2,
        "proj",
      ],
      [
        "Tasks",
        "Ta",
        "Keys, states, assignees, due dates and a timer on every task.",
        true,
        6,
        1,
        2,
      ],
      [
        "Dashboards",
        "Db",
        "Charts built from your projects and tasks.",
        false,
        3,
        1,
        1,
      ],
      ["Forms", "Fm", "Collect requests that turn into tasks.", false, 3, 1, 1],
    ],
  ],
  [
    "Knowledge",
    "var(--lav)",
    [
      [
        "Docs",
        "Dc",
        "Specs and notes that link to the tasks they describe.",
        true,
        8,
        1,
        2,
        "docs",
      ],
      [
        "Files",
        "Fl",
        "Store a file once and attach it anywhere.",
        false,
        4,
        1,
        2,
      ],
    ],
  ],
  [
    "Talk",
    "var(--peach)",
    [
      ["Chat", "Ch", "Channels and threads next to the work.", false, 4, 1, 1],
      [
        "Meetings",
        "Mt",
        "Agendas and notes that turn into tasks.",
        false,
        3,
        1,
        1,
      ],
      ["Mail", "Ml", "Shared inboxes inside the workspace.", false, 5, 1, 2],
      ["Calendar", "Ca", "Team calendars tied to due dates.", false, 5, 1, 1],
      [
        "Tickets",
        "Tk",
        "Support requests linked to the tasks that fix them.",
        false,
        7,
        1,
        1,
        undefined,
        "var(--rosep)",
      ],
    ],
  ],
  [
    "Company",
    "var(--mint)",
    [
      ["Teams", "Te", "Group people and set who works on what.", true, 4, 1, 1],
      [
        "Roles & permissions",
        "Ro",
        "One role model across every module.",
        true,
        5,
        2,
        2,
        "roles",
      ],
      ["Audit log", "Au", "Every change, who made it and when.", true, 3, 1, 1],
      [
        "Modules",
        "Mo",
        "Turn modules on or off for the whole org.",
        true,
        4,
        1,
        1,
      ],
      ["Admin", "Ad", "Org settings, domains and security.", false, 3, 1, 1],
      [
        "HR",
        "HR",
        "Employee records, time off and onboarding.",
        false,
        6,
        1,
        1,
      ],
      [
        "Payroll",
        "Py",
        "Run pay from the same employee records.",
        false,
        6,
        1,
        1,
      ],
    ],
  ],
];

export const MATRIX: Array<[string, string, number[]]> = [
  ["Projects", "view", [2, 2, 2, 1]],
  ["Projects", "edit", [2, 2, 1, 0]],
  ["Tasks", "create", [2, 2, 2, 0]],
  ["Tasks", "assign others", [2, 2, 2, 0]],
  ["Docs", "edit", [2, 2, 2, 1]],
  ["Docs", "share outside org", [2, 2, 0, 0]],
  ["Teams", "manage members", [2, 2, 0, 0]],
  ["Roles", "change", [2, 0, 0, 0]],
  ["Audit log", "view", [2, 2, 0, 0]],
  ["Modules", "turn on or off", [2, 0, 0, 0]],
];

export const AUDIT: Array<[string, string, string]> = [
  ["09:12", "Priya Shah", "gave Member edit access to Docs"],
  ["09:40", "Jonas Lind", "turned on Tasks for Fernway"],
  ["10:05", "Mira Okafor", "moved ZEN-142 to In progress"],
  ["10:31", "Priya Shah", "removed “Modules · turn on or off” from Admin"],
  ["11:02", "Tomás Reyes", "invited 2 guests to Onboarding v2"],
];

export const PULSE: Array<[string, string, string, string, string]> = [
  [
    "MO",
    "Mira Okafor",
    "ZEN-142 · onboarding checklist",
    "var(--amber)",
    "var(--lav)",
  ],
  [
    "JL",
    "Jonas Lind",
    "ZEN-138 · roles migration",
    "var(--cyan)",
    "var(--sky)",
  ],
  [
    "PS",
    "Priya Shah",
    "ZEN-131 · docs share settings",
    "var(--green)",
    "var(--mint)",
  ],
  [
    "TR",
    "Tomás Reyes",
    "ZEN-127 · audit log export",
    "var(--rose)",
    "var(--peach)",
  ],
];

export const FOOT_LIVE = [
  "Projects",
  "Tasks",
  "Teams",
  "Docs",
  "Roles & permissions",
  "Audit log",
  "Modules",
];
export const FOOT_SOON = [
  "Files",
  "Chat",
  "Meetings",
  "Mail",
  "Calendar",
  "HR",
  "Payroll",
  "Tickets",
  "Forms",
  "Dashboards",
  "Admin",
];

// Layout variables, desktop (LD) and mobile (LM). Colors live in globals.css.
export const LD: Record<string, string> = {
  "--px": "128px",
  "--pr": "64px",
  "--tx": "64px",
  "--h1": "80px",
  "--h2": "56px",
  "--h3": "112px",
  "--lead": "19px",
  "--sec": "176px",
  "--shotW": "980px",
  "--shotCols": "200px minmax(0,1fr)",
  "--sbD": "block",
  "--heroGap": "72px",
  "--navPL": "53px",
  "--s2H": "600px",
  "--s2PB": "0px",
  "--lineY": "300px",
  "--s2bW": "calc(50% - 170px - 64px)",
  "--s2cX": "50%",
  "--s2cT": "470px",
  "--chL": "128px",
  "--chT": "100px",
  "--chW": "440px",
  "--chH": "400px",
  "--tlPos": "absolute",
  "--tlL": "calc(50% - 170px)",
  "--tlT": "130px",
  "--tlW": "340px",
  "--tlH": "340px",
  "--tlM": "0",
  "--txPos": "absolute",
  "--txL": "calc(50% + 230px)",
  "--txR": "64px",
  "--txT": "50%",
  "--txTr": "translateY(-50%)",
  "--txM": "0",
  "--s3x": "50%",
  "--s3HW": "720px",
  "--taskW": "460px",
  "--taskML": "calc(50% - 230px)",
  "--taskMR": "auto",
  "--attCols": "minmax(0,1fr) minmax(0,1fr)",
  "--attPL": "64px",
  "--attPR": "64px",
  "--gCols": "192px minmax(0,1fr)",
  "--bCols": "12",
  "--bRow": "minmax(156px,auto)",
  "--repPL": "224px",
  "--mxCols": "minmax(0,1.7fr) repeat(4,minmax(0,1fr))",
  "--panelMT": "96px",
  "--ctaX": "50%",
  "--ctaPL": "64px",
  "--ctaAlign": "center",
  "--ctaJ": "center",
  "--ctaM": "0 auto",
};

export const LM: Record<string, string> = {
  "--px": "44px",
  "--pr": "20px",
  "--tx": "20px",
  "--h1": "46px",
  "--h2": "36px",
  "--h3": "54px",
  "--lead": "17px",
  "--sec": "104px",
  "--shotW": "560px",
  "--shotCols": "minmax(0,1fr)",
  "--sbD": "none",
  "--heroGap": "44px",
  "--navPL": "9px",
  "--s2H": "auto",
  "--s2PB": "72px",
  "--lineY": "200px",
  "--s2bW": "calc(100% - 40px)",
  "--s2cX": "20px",
  "--s2cT": "200px",
  "--chL": "44px",
  "--chT": "60px",
  "--chW": "326px",
  "--chH": "280px",
  "--tlPos": "relative",
  "--tlL": "auto",
  "--tlT": "auto",
  "--tlW": "auto",
  "--tlH": "auto",
  "--tlM": "360px 20px 0 44px",
  "--txPos": "relative",
  "--txL": "auto",
  "--txR": "auto",
  "--txT": "auto",
  "--txTr": "none",
  "--txM": "48px 20px 0 44px",
  "--s3x": "20px",
  "--s3HW": "none",
  "--taskW": "auto",
  "--taskML": "44px",
  "--taskMR": "20px",
  "--attCols": "minmax(0,1fr)",
  "--attPL": "44px",
  "--attPR": "20px",
  "--gCols": "minmax(0,1fr)",
  "--bCols": "2",
  "--bRow": "minmax(150px,auto)",
  "--repPL": "0px",
  "--mxCols": "minmax(0,1.5fr) repeat(4,minmax(0,1fr))",
  "--panelMT": "0px",
  "--ctaX": "20px",
  "--ctaPL": "44px",
  "--ctaAlign": "left",
  "--ctaJ": "flex-start",
  "--ctaM": "0",
};
