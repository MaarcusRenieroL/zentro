"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { PageHeader } from "@zentro/ui/components/page-header";
import { Button } from "@zentro/ui/shadcn/button";
import { toast, toastError } from "@zentro/ui/index";

import {
  addDays,
  addMonths,
  sameDay,
  startOfDay,
  visibleDays,
  type ViewMode,
} from "./dates";
import {
  EventDialog,
  colors,
  type CalendarEventItem,
  type EventColor,
  type EventDraft,
} from "./event-dialog";

const HOUR = 48;
const modes: ViewMode[] = ["month", "week", "day"];

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function colorClass(color: string) {
  return colors[(color in colors ? color : "blue") as EventColor];
}

function eventsOn(events: CalendarEventItem[], day: Date) {
  const start = +startOfDay(day);
  const end = +addDays(day, 1);
  return events.filter(
    (e) => +new Date(e.startsAt) < end && +new Date(e.endsAt) > start,
  );
}

function toDraft(event: CalendarEventItem): EventDraft {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    color: (event.color in colors ? event.color : "blue") as EventColor,
    allDay: event.allDay,
    startsAt: new Date(event.startsAt),
    endsAt: new Date(event.endsAt),
  };
}

export function CalendarView() {
  const trpc = useTrpcClient();
  const [mode, setMode] = useState<ViewMode>("month");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [canCreate, setCanCreate] = useState(true);

  const days = useMemo(() => visibleDays(mode, anchor), [mode, anchor]);
  const from = days[0]!;
  const to = addDays(days[days.length - 1]!, 1);

  const load = useCallback(async () => {
    try {
      setEvents(
        await trpc.calendar.list.query({
          from: from.toISOString(),
          to: to.toISOString(),
        }),
      );
      setFailed(false);
    } catch {
      setFailed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trpc, +from, +to]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = draft?.id
    ? events.find((event) => event.id === draft.id)
    : undefined;

  function step(direction: -1 | 1) {
    setAnchor((current) =>
      mode === "month"
        ? addMonths(current, direction)
        : addDays(current, direction * (mode === "week" ? 7 : 1)),
    );
  }

  function blank(day: Date, hour?: number): EventDraft {
    const start = new Date(day);
    start.setHours(hour ?? 9, 0, 0, 0);
    return {
      title: "",
      description: null,
      location: null,
      color: "blue",
      allDay: hour === undefined && mode === "month",
      startsAt:
        hour === undefined && mode === "month" ? startOfDay(day) : start,
      endsAt:
        hour === undefined && mode === "month"
          ? addDays(startOfDay(day), 1)
          : new Date(start.getTime() + 36e5),
    };
  }

  async function save(value: EventDraft) {
    const data = {
      title: value.title,
      description: value.description,
      location: value.location,
      color: value.color,
      allDay: value.allDay,
      startsAt: value.startsAt.toISOString(),
      endsAt: value.endsAt.toISOString(),
    };

    try {
      if (value.id) await trpc.calendar.update.mutate({ id: value.id, data });
      else await trpc.calendar.create.mutate(data);
    } catch (error) {
      if (error instanceof Error && /FORBIDDEN|permission/i.test(error.message))
        setCanCreate(false);
      throw error;
    }

    setDraft(null);
    toast.success(value.id ? "Event updated" : "Event added");
    await load();
  }

  async function remove(id: string) {
    await trpc.calendar.remove.mutate({ id });
    setDraft(null);
    toast.success("Event deleted");
    await load();
  }

  const title =
    mode === "month"
      ? anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : mode === "day"
        ? anchor.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : `${days[0]!.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${days[6]!.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  const today = new Date();

  function chip(event: CalendarEventItem) {
    return (
      <button
        key={event.id}
        type="button"
        onClick={() => setDraft(toDraft(event))}
        className={`w-full truncate rounded border px-1.5 py-0.5 text-left text-xs ${colorClass(event.color)}`}
      >
        {event.allDay ? "" : `${timeFormat.format(new Date(event.startsAt))} `}
        {event.title}
      </button>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
      <PageHeader
        title="Calendar"
        description="Meetings, deadlines and time off, shared with your team."
        actions={
          canCreate ? (
            <Button
              onClick={() =>
                setDraft(blank(new Date(), new Date().getHours() + 1))
              }
            >
              <PlusIcon aria-hidden />
              New event
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAnchor(startOfDay(new Date()))}
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous"
          onClick={() => step(-1)}
        >
          <ChevronLeftIcon aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next"
          onClick={() => step(1)}
        >
          <ChevronRightIcon aria-hidden />
        </Button>
        <h2 className="text-lg font-semibold" aria-live="polite">
          {title}
        </h2>
        <div className="ml-auto flex gap-1" role="group" aria-label="View">
          {modes.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={mode === item ? "secondary" : "ghost"}
              aria-pressed={mode === item}
              onClick={() => setMode(item)}
              className="capitalize"
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      {failed ? (
        <p role="alert" className="text-sm">
          Events did not load.{" "}
          <button className="underline" onClick={() => void load()}>
            Retry
          </button>
        </p>
      ) : null}

      {mode === "month" ? (
        <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-line">
          {days.slice(0, 7).map((day) => (
            <div
              key={+day}
              className="border-b border-line bg-sunken px-2 py-1.5 text-xs font-medium text-ink-2"
            >
              {day.toLocaleDateString(undefined, { weekday: "short" })}
            </div>
          ))}
          {days.map((day) => {
            const list = eventsOn(events, day);
            const outside = day.getMonth() !== anchor.getMonth();
            return (
              <div
                key={+day}
                className={`flex min-h-24 flex-col gap-1 border-r border-b border-line p-1.5 ${outside ? "bg-sunken/50 text-ink-3" : ""}`}
              >
                <button
                  type="button"
                  aria-label={`Add event on ${day.toDateString()}`}
                  onClick={() => canCreate && setDraft(blank(day))}
                  className={`self-start rounded-full px-1.5 text-xs ${sameDay(day, today) ? "bg-ink text-canvas" : ""}`}
                >
                  {day.getDate()}
                </button>
                {list.slice(0, 3).map(chip)}
                {list.length > 3 ? (
                  <button
                    type="button"
                    className="text-left text-xs text-ink-2 underline"
                    onClick={() => {
                      setAnchor(day);
                      setMode("day");
                    }}
                  >
                    +{list.length - 3} more
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <TimeGrid
          days={days}
          events={events}
          today={today}
          onSlot={(day, hour) => canCreate && setDraft(blank(day, hour))}
          onEvent={(event) => setDraft(toDraft(event))}
        />
      )}

      <EventDialog
        draft={draft}
        readOnly={Boolean(draft?.id && !selected?.canManage)}
        createdBy={selected?.createdBy}
        onClose={() => setDraft(null)}
        onSave={save}
        onDelete={async (id) => {
          try {
            await remove(id);
          } catch (error) {
            toastError(
              "Could not delete the event",
              error instanceof Error ? error.message : undefined,
            );
            throw error;
          }
        }}
      />
    </div>
  );
}

function TimeGrid({
  days,
  events,
  today,
  onSlot,
  onEvent,
}: {
  days: Date[];
  events: CalendarEventItem[];
  today: Date;
  onSlot: (day: Date, hour: number) => void;
  onEvent: (event: CalendarEventItem) => void;
}) {
  const cols = {
    gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))`,
  };
  const hours = Array.from({ length: 24 }, (_, h) => h);

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <div className="min-w-[36rem]">
        <div className="grid border-b border-line bg-sunken" style={cols}>
          <div />
          {days.map((day) => (
            <div
              key={+day}
              className={`px-2 py-1.5 text-xs font-medium ${sameDay(day, today) ? "text-ink" : "text-ink-2"}`}
            >
              {day.toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
              })}
            </div>
          ))}
        </div>

        <div className="grid border-b border-line" style={cols}>
          <div className="px-1 py-1 text-right text-[10px] text-ink-3">
            All day
          </div>
          {days.map((day) => (
            <div
              key={+day}
              className="flex flex-col gap-0.5 border-l border-line p-1"
            >
              {eventsOn(events, day)
                .filter((e) => e.allDay)
                .map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onEvent(event)}
                    className={`truncate rounded border px-1.5 py-0.5 text-left text-xs ${colorClass(event.color)}`}
                  >
                    {event.title}
                  </button>
                ))}
            </div>
          ))}
        </div>

        <div className="relative grid" style={cols}>
          <div>
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR }}
                className="pr-1 text-right text-[10px] text-ink-3"
              >
                {h === 0
                  ? ""
                  : timeFormat
                      .format(new Date(2000, 0, 1, h))
                      .replace(":00", "")}
              </div>
            ))}
          </div>
          {days.map((day) => {
            const dayStart = +startOfDay(day);
            return (
              <div key={+day} className="relative border-l border-line">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    aria-label={`New event ${day.toDateString()} ${h}:00`}
                    style={{ height: HOUR }}
                    onClick={() => onSlot(day, h)}
                    className="block w-full border-b border-line/60 hover:bg-sunken"
                  />
                ))}
                {eventsOn(events, day)
                  .filter((e) => !e.allDay)
                  .map((event) => {
                    const s = Math.max(+new Date(event.startsAt), dayStart);
                    const e = Math.min(
                      +new Date(event.endsAt),
                      dayStart + 864e5,
                    );
                    const top = ((s - dayStart) / 36e5) * HOUR;
                    const height = Math.max(((e - s) / 36e5) * HOUR, 20);
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onEvent(event)}
                        style={{ top, height }}
                        className={`absolute inset-x-0.5 overflow-hidden rounded border px-1.5 py-0.5 text-left text-xs ${colorClass(event.color)}`}
                      >
                        <span className="font-medium">{event.title}</span>
                        <br />
                        {timeFormat.format(new Date(event.startsAt))}
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
