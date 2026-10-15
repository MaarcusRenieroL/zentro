"use client";

import { useMemo, useState, type ReactNode } from "react";

import { InboxView } from "~/src/components/notifications/inbox-view";
import { NotificationsProvider } from "~/src/components/notifications/notifications-provider";
import { NotificationBell } from "~/src/components/notifications/notification-bell";
import { sampleNotifications } from "~/src/components/notifications/sample-notifications";
import { ComingSoon } from "~/src/components/system/coming-soon";
import { ServerErrorContent } from "~/src/components/system/server-error-content";
import { UnauthorizedEmptyState } from "~/src/components/workspace/authorization/authorization-boundary";

function Frame({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-b border-hairline py-10">
      <p className="eyebrow mb-6">{label}</p>
      {children}
    </section>
  );
}

export function Screens() {
  const seed = useMemo(() => sampleNotifications(), []);
  const [theme, setTheme] = useState<"" | "dark">("");

  return (
    <main className={`${theme} min-h-screen bg-canvas px-8 py-6 text-ink`}>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="font-display text-3xl">Screens</h1>
        <button
          type="button"
          className="rounded-full border border-hairline px-3 py-1 text-sm"
          onClick={() => setTheme((value) => (value ? "" : "dark"))}
        >
          {theme ? "Dark" : "Light"}
        </button>
        <NotificationsProvider initial={seed}>
          <div id="bell-demo">
            <NotificationBell />
          </div>
        </NotificationsProvider>
      </div>

      <Frame id="inbox" label="21d · Inbox">
        <NotificationsProvider initial={seed}>
          <InboxView />
        </NotificationsProvider>
      </Frame>
      <Frame id="inbox-loading" label="21f · Inbox loading">
        <NotificationsProvider initial={seed}>
          <InboxView state="loading" />
        </NotificationsProvider>
      </Frame>
      <Frame id="inbox-error" label="21h · Inbox error">
        <NotificationsProvider initial={seed}>
          <InboxView state="error" />
        </NotificationsProvider>
      </Frame>
      <Frame id="forbidden" label="22c · 403">
        <UnauthorizedEmptyState permission="docs.view" />
      </Frame>
      <Frame id="server-error" label="22e · 500">
        <ServerErrorContent
          requestId="req_7c3e10ad"
          onRetry={() => undefined}
        />
      </Frame>
      <Frame id="files" label="23a · Files">
        <ComingSoon kind="files" email="priya@northwind.dev" />
      </Frame>
      <Frame id="chat" label="23c · Chat">
        <ComingSoon kind="chat" email="priya@northwind.dev" />
      </Frame>
    </main>
  );
}
