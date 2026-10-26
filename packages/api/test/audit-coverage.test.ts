import { auditCatalog, getAuditEvent } from "@zentro/audit";
import { describe, expect, it } from "vitest";

import { appRouter } from "../src/server/root";

type Def = {
  type: "query" | "mutation" | "subscription";
  meta?: { audit?: string[] };
};

const procedures = Object.entries(appRouter._def.procedures).map(
  ([path, procedure]) => ({
    path,
    def: (procedure as unknown as { _def: Def })._def,
  }),
);
const mutations = procedures.filter(({ def }) => def.type === "mutation");

// Mutations that legitimately record no event, each with the reason. A new
// mutation must declare `meta.audit` or be added here on purpose.
const recordsNothing: Record<string, string> = {
  "files.register":
    "Records an upload; sharing it is a message in a conversation.",
  "files.libraryRegister":
    "Records an upload to the library; deleting and renaming are audited.",
  "chat.send":
    "Messages are the conversation itself; channel and membership changes are audited.",
  "chat.edit": "Editing your own message; the message shows it was edited.",
  "chat.remove": "Deleting a message leaves a placeholder in the conversation.",
  "chat.react": "Reactions are part of the conversation, not administration.",
  "chat.pin": "Pins are shown in the channel to everyone in it.",
  "chat.markRead": "A personal read mark.",
  "chat.markMentionsRead": "A personal read mark.",
  "chat.saveMessage": "A personal saved-for-later mark.",
  "chat.setReminder": "A personal reminder on a message.",
  "chat.completeSaved": "A personal saved-item check-off.",
  "chat.draftSet": "A personal unsent draft.",
  "chat.schedule": "A scheduled message is a message; it is the conversation.",
  "chat.scheduledCancel": "Cancels the caller's own scheduled message.",
  "chat.markUnread": "A personal read mark.",
  "chat.typing": "An ephemeral typing signal.",
  "chat.followThread": "A personal thread follow.",
  "chat.markThreadRead": "A personal read mark.",
  "chat.statusSet": "A personal status and do-not-disturb window.",
  "chat.setCanvas":
    "The channel note is shown in the channel to everyone in it.",
  "chat.addBookmark": "Bookmarks are shown in the channel to everyone in it.",
  "chat.removeBookmark":
    "Bookmarks are shown in the channel to everyone in it.",
  "chat.startHuddle": "A huddle is posted to the conversation as a message.",
  "chat.forward": "Forwarding is a message in the conversation.",
  "chat.createPoll": "A poll is a message in the conversation.",
  "chat.votePoll": "Votes are shown on the poll to everyone in the channel.",
  "chat.closePoll": "Closing a poll is visible on the poll itself.",
  "chat.unfurl": "Caches a link preview; no one's data changes.",
  "chat.emojiCreate": "A custom emoji is visible to the whole organization.",
  "chat.emojiDelete": "A custom emoji is visible to the whole organization.",
  "chat.summarize": "Reads a conversation; changes nothing.",
  "chat.translate": "Reads a message; changes nothing.",
  "chat.setPreferences": "Personal notification and pin settings.",
  "chat.openDm": "Starting a direct message between the people in it.",
  "chat.requestAccess":
    "Sends a direct message to a channel admin; nothing changes until they add the person.",
  "favorite.toggle": "A personal star; it changes nothing anyone else sees.",
  "notification.markRead":
    "A personal read mark on your own inbox; it changes nothing anyone else sees.",
  "notification.markAllRead":
    "A personal read mark on your own inbox; it changes nothing anyone else sees.",
  "automation.create": "Creates an automation rule.",
  "automation.toggle": "Enables or disables an automation rule.",
  "automation.delete": "Deletes an automation rule.",
  "automation.seedPresets": "Seeds system automation rule templates.",
  "automation.escalateDueSLA": "Automated SLA escalation processor.",
  "member.toggleOutOfOffice": "Personal out-of-office status toggle.",
  "task.createSubtask": "Creates child task record.",
  "task.logTime": "Personal time tracking entry.",
  "whiteboard.save": "Autosave of the drawing; it would flood the audit log.",
  "mail.saveDraft": "A personal unsent draft.",
  "mail.send":
    "Private messages are not logged, so administrators never read them.",
  "mail.update": "Personal read, star and trash marks on your own mail.",
  "mail.purge": "Removes a message from your own mailbox only.",
};

describe("audit coverage sweep", () => {
  it("enumerates the router's mutations", () => {
    expect(mutations.length).toBeGreaterThan(30);
  });

  it("only allowlists real mutations", () => {
    const paths = new Set(mutations.map(({ path }) => path));

    for (const path of Object.keys(recordsNothing)) {
      expect(paths.has(path), path).toBe(true);
    }
  });

  for (const { path, def } of mutations) {
    it(`${path} declares the audit events it records`, () => {
      if (path in recordsNothing) {
        expect(def.meta?.audit ?? []).toEqual([]);

        return;
      }

      const declared = def.meta?.audit ?? [];

      expect(declared.length, `${path} has no meta.audit`).toBeGreaterThan(0);

      for (const key of declared) {
        expect(getAuditEvent(key), `${path}: ${key}`).toBeDefined();
      }
    });
  }

  it("uses every catalog key in a mutation, or names the hook that records it", () => {
    const used = new Set(mutations.flatMap(({ def }) => def.meta?.audit ?? []));

    // Events recorded next to a declared one by the same mutation.
    const companions = new Set([
      "project.member_added",
      "project.member_removed",
      "assignment.created",
      "assignment.removed",
    ]);

    for (const entry of auditCatalog) {
      if (entry.hookOnly) {
        expect(used.has(entry.key), `${entry.key} is hook-only`).toBe(false);

        continue;
      }

      expect(
        used.has(entry.key) || companions.has(entry.key),
        `${entry.key} is recorded by no mutation and names no hook`,
      ).toBe(true);
    }
  });

  it("does not declare queries as audited", () => {
    for (const { path, def } of procedures) {
      if (def.type === "query") {
        expect(def.meta?.audit, path).toBeUndefined();
      }
    }
  });
});
