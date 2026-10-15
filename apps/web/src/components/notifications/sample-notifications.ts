import type { NotificationItem } from "./notifications";

/**
 * Sample data from the design handoff. Used only by the dev gallery; the
 * workspace has no notification source yet.
 */
export function sampleNotifications(
  now: Date = new Date(),
): NotificationItem[] {
  const at = (daysAgo: number, time: string) => {
    const [hours = 0, minutes = 0] = time.split(":").map(Number);
    const date = new Date(now);

    date.setDate(date.getDate() - daysAgo);
    date.setHours(hours, minutes, 0, 0);

    return date.toISOString();
  };

  return [
    {
      id: "n1",
      kind: "mention",
      actor: "Arjun Mehta",
      verb: "mentioned you in",
      object: "ZEN-18",
      objectIsKey: true,
      title: "Fix login redirect loop on expired sessions",
      quote:
        "@Priya the loop only happens when the refresh token is also expired. Can you confirm before I ship?",
      unread: true,
      createdAt: at(0, "09:52"),
    },
    {
      id: "n2",
      kind: "approval",
      actor: "Tom Becker",
      verb: "asked for Editor access to",
      object: "Billing Revamp",
      unread: true,
      createdAt: at(0, "09:31"),
    },
    {
      id: "n3",
      kind: "assignment",
      actor: "Meera Iyer",
      verb: "assigned you",
      object: "ONB-14",
      objectIsKey: true,
      title: "Empty state for brand-new workspaces",
      unread: true,
      createdAt: at(0, "08:47"),
    },
    {
      id: "n4",
      kind: "comment",
      actor: "Lena Hoffmann",
      verb: "commented on",
      object: "Session handling spec",
      quote: "Added the token rotation diagram under section 3.",
      unread: true,
      createdAt: at(0, "08:15"),
    },
    {
      id: "n5",
      kind: "assignment",
      actor: "Tom Becker",
      verb: "assigned you",
      object: "ZEN-29",
      objectIsKey: true,
      title: "Retry failed webhook deliveries",
      unread: false,
      createdAt: at(1, "17:20"),
    },
    {
      id: "n6",
      kind: "assignment",
      chip: "Review",
      actor: "Arjun Mehta",
      verb: "asked you to review",
      object: "BIL-4",
      objectIsKey: true,
      title: "Proration rules for mid-cycle upgrades",
      unread: false,
      createdAt: at(1, "15:02"),
    },
    {
      id: "n7",
      kind: "approval",
      actor: "Meera Iyer",
      verb: "asked to publish",
      object: "Onboarding copy v2",
      unread: false,
      createdAt: at(1, "11:40"),
    },
    {
      id: "n8",
      kind: "mention",
      actor: "Lena Hoffmann",
      verb: "mentioned you in",
      object: "Weekly update · Oct 12",
      quote: "Thanks @Priya for unblocking the billing migration.",
      unread: false,
      createdAt: at(2, "16:05"),
    },
  ];
}
