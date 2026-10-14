"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";

import { Breadcrumbs } from "@zentro/ui/components/breadcrumbs";
import { CountUp } from "@zentro/ui/components/count-up";
import { EmptyState } from "@zentro/ui/components/empty-state";
import { ErrorState } from "@zentro/ui/components/error-state";
import { FigureRow, StatCard } from "@zentro/ui/components/figure-row";
import { InlineAlert } from "@zentro/ui/components/inline-alert";
import { Kbd } from "@zentro/ui/components/kbd";
import { OrgAvatar } from "@zentro/ui/components/org-avatar";
import { PageHeader } from "@zentro/ui/components/page-header";
import { SectionCard } from "@zentro/ui/components/section-card";
import { SectionNav } from "@zentro/ui/components/section-nav";
import { Spinner } from "@zentro/ui/components/spinner";
import { PriorityGlyph, StatusGlyph } from "@zentro/ui/components/status-glyph";
import { Thread, ThreadItem } from "@zentro/ui/components/thread";
import { Chip } from "@zentro/ui/components/chip";
import { Combobox } from "@zentro/ui/components/combobox";
import { DayRing } from "@zentro/ui/components/day-ring";
import { DotMatrix } from "@zentro/ui/components/dot-matrix";
import { SegmentedControl } from "@zentro/ui/components/segmented-control";
import { Stat } from "@zentro/ui/components/stat";
import { TaskKey } from "@zentro/ui/components/task-key";
import { TeamPulse } from "@zentro/ui/components/team-pulse";
import { Tile } from "@zentro/ui/components/tile";
import { Toolbar } from "@zentro/ui/components/toolbar";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@zentro/ui/shadcn/avatar";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { Checkbox } from "@zentro/ui/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zentro/ui/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";
import { Input } from "@zentro/ui/shadcn/input";
import { Progress } from "@zentro/ui/shadcn/progress";
import { RadioGroup, RadioGroupItem } from "@zentro/ui/shadcn/radio-group";
import { ScrollArea } from "@zentro/ui/shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { Separator } from "@zentro/ui/shadcn/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@zentro/ui/shadcn/sheet";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";
import { Switch } from "@zentro/ui/shadcn/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zentro/ui/shadcn/table";
import { Tabs, TabsList, TabsTrigger } from "@zentro/ui/shadcn/tabs";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@zentro/ui/shadcn/tooltip";
import { toastSuccess, toastError } from "@zentro/ui/index";

const statuses = ["backlog", "todo", "in-progress", "review", "done"];
const variants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium tracking-wide text-ink-3 uppercase">
        {title}
      </h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

function Specimens() {
  const [tab, setTab] = useState("one");

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <PageHeader
          breadcrumbs={
            <Breadcrumbs
              LinkComponent={Link}
              items={[
                { label: "Projects", href: "/projects" },
                { label: "Website Redesign", href: "/projects/x" },
                { label: "WR-12", mono: true },
              ]}
            />
          }
          title="Page header"
          description="A serif title, one line of context and the actions on the right."
          actions={
            <>
              <Button variant="outline">Secondary</Button>
              <Button>
                <PlusIcon /> Create
              </Button>
            </>
          }
        />

        <Block title="Start button (the only 52px control)">
          <Button size="start">Start</Button>
          <Button size="start" variant="secondary">
            Mark done
          </Button>
        </Block>

        <Block title="Momentum: state, keys, rings">
          {statuses.map((status) => (
            <span key={status} className="inline-flex items-center gap-2">
              <StatusGlyph status={status} />
              <TaskKey>ZEN-9</TaskKey>
            </span>
          ))}
          <StatusGlyph status="done" celebrate />
          <DayRing done={3} planned={5} size={96} />
          <DayRing done={5} planned={5} size={96} />
          <DotMatrix
            label="Team activity this week"
            values={[2, 5, 8, 4, 9, 1, 0]}
            labels={["M", "T", "W", "T", "F", "S", "S"]}
          />
          <Stat label="Open tasks" value="24" trend="+3 this week" />
        </Block>

        <section className="grid gap-4 sm:grid-cols-2">
          <Tile
            tint="projects"
            icon={<PlusIcon />}
            title="Projects"
            description="Sky tint"
          >
            <Progress value={62} />
          </Tile>
          <Tile
            tint="tasks"
            icon={<PlusIcon />}
            title="Tasks"
            description="Lavender tint"
          >
            <TeamPulse
              items={[
                {
                  id: "1",
                  actor: "Mei Lin",
                  verb: "started",
                  taskKey: "ZEN-9",
                  title: "Dark mode",
                  when: "2m",
                },
                {
                  id: "2",
                  actor: "Tomás",
                  verb: "finished",
                  taskKey: "ZEN-4",
                  title: "Import CSV",
                  when: "9m",
                },
              ]}
            />
          </Tile>
          <Tile
            tint="docs"
            icon={<PlusIcon />}
            title="Docs"
            description="Peach tint"
          />
          <Tile
            tint="teams"
            icon={<PlusIcon />}
            title="Teams"
            description="Mint tint"
          />
          <Tile
            tint="audit"
            icon={<PlusIcon />}
            title="Audit"
            description="Rose tint"
          />
        </section>

        <Block title="Segmented control, chips, combobox">
          <SegmentedControl
            label="Density"
            value={tab === "one" ? "comfortable" : "compact"}
            onValueChange={(value) =>
              setTab(value === "comfortable" ? "one" : "two")
            }
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
          <Chip>design</Chip>
          <Chip tone="accent" onRemove={() => {}}>
            ZEN-9
          </Chip>
          <div className="w-56">
            <Combobox
              value={tab}
              onValueChange={setTab}
              placeholder="Project"
              options={[
                { value: "one", label: "Website Redesign", hint: "WR" },
                { value: "two", label: "Mobile App", hint: "MA" },
              ]}
            />
          </div>
        </Block>

        <Block title="Buttons">
          {variants.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
          <Button size="xs">xs</Button>
          <Button size="sm">sm</Button>
          <Button size="lg">lg</Button>
          <Button size="icon" aria-label="Search" variant="outline">
            <SearchIcon />
          </Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button variant="destructive">
            <Trash2Icon /> Delete
          </Button>
        </Block>

        <Block title="Fields">
          <Input className="w-56" placeholder="Input" />
          <Input className="w-56" defaultValue="Invalid" aria-invalid />
          <Input className="w-56" disabled placeholder="Disabled" />
          <Select defaultValue="a">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Option A</SelectItem>
              <SelectItem value="b">Option B</SelectItem>
            </SelectContent>
          </Select>
          <Textarea className="w-64" placeholder="Textarea" />
          <Checkbox defaultChecked aria-label="Checked" />
          <Checkbox aria-label="Unchecked" />
          <Switch defaultChecked aria-label="On" />
          <Switch aria-label="Off" />
          <RadioGroup defaultValue="x" className="flex gap-3">
            <RadioGroupItem value="x" aria-label="X" />
            <RadioGroupItem value="y" aria-label="Y" />
          </RadioGroup>
        </Block>

        <Block title="Tabs and section navigation">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="one">Overview</TabsTrigger>
              <TabsTrigger value="two">Tasks</TabsTrigger>
              <TabsTrigger value="three">Docs</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList variant="line">
              <TabsTrigger value="one">Overview</TabsTrigger>
              <TabsTrigger value="two">Tasks</TabsTrigger>
              <TabsTrigger value="three">Docs</TabsTrigger>
            </TabsList>
          </Tabs>
          <SectionNav
            LinkComponent={Link}
            activeHref="/dev/ui"
            items={[
              { href: "/dev/ui", label: "All" },
              { href: "/dev/x", label: "Overview" },
              { href: "/dev/y", label: "Completed" },
            ]}
          />
        </Block>

        <Block title="Badges">
          {[
            "default",
            "secondary",
            "signal",
            "success",
            "warning",
            "info",
            "destructive",
            "outline",
          ].map((variant) => (
            <Badge key={variant} variant={variant as "default"}>
              {variant}
            </Badge>
          ))}
        </Block>

        <Block title="Status and priority">
          {statuses.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1.5 text-sm"
            >
              <StatusGlyph status={status} />
              {status}
            </span>
          ))}
          {["low", "medium", "high"].map((priority) => (
            <span
              key={priority}
              className="inline-flex items-center gap-1.5 text-sm"
            >
              <PriorityGlyph priority={priority} />
              {priority}
            </span>
          ))}
        </Block>

        <Block title="Avatars">
          <Avatar>
            <AvatarFallback seed="u1">PN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback seed="u2">DO</AvatarFallback>
          </Avatar>
          <AvatarGroup>
            {["a", "b", "c"].map((seed) => (
              <Avatar key={seed}>
                <AvatarFallback seed={seed}>
                  {seed.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>
          <OrgAvatar name="Acme Studio" />
          <OrgAvatar name="Empty Co" size="lg" />
        </Block>

        <Block title="Figures">
          <FigureRow
            figures={[
              { label: "Members", value: <CountUp id="g-m" value={8} /> },
              { label: "Projects", value: 6 },
              { label: "Open tasks", value: 37 },
            ]}
          />
          <StatCard
            label="Docs"
            value={10}
            hint="2 in the trash"
            className="w-44"
          />
          <Kbd>⌘K</Kbd>
          <Spinner />
          <div className="w-40">
            <Progress value={60} aria-label="Progress" />
          </div>
        </Block>

        <Block title="Table">
          <Card className="w-full max-w-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">WR-1</TableCell>
                  <TableCell>Fix login</TableCell>
                  <TableCell>
                    <StatusGlyph status="in-progress" />
                  </TableCell>
                </TableRow>
                <TableRow data-state="selected">
                  <TableCell className="font-mono text-xs">WR-2</TableCell>
                  <TableCell>Update copy</TableCell>
                  <TableCell>
                    <StatusGlyph status="done" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </Block>

        <Block title="Cards and sections">
          <Card className="w-72">
            <CardHeader>
              <CardTitle>Card</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-ink-2">
              Surface, hairline, no shadow.
            </CardContent>
          </Card>
          <SectionCard
            className="w-72"
            title="Section card"
            description="With a header"
            actions={
              <Button size="sm" variant="outline">
                Edit
              </Button>
            }
          >
            <p className="text-sm text-ink-2">Body</p>
          </SectionCard>
        </Block>

        <Block title="Thread">
          <Thread className="w-80">
            <ThreadItem
              node={
                <Avatar className="size-6">
                  <AvatarFallback seed="p">PN</AvatarFallback>
                </Avatar>
              }
            >
              <p className="text-sm">
                Priya moved WR-1 from To do to In progress
              </p>
              <p className="text-xs text-ink-3">2 minutes ago</p>
            </ThreadItem>
            <ThreadItem>
              <p className="text-sm">Daniel commented on WR-1</p>
            </ThreadItem>
          </Thread>
        </Block>

        <Block title="States">
          <EmptyState
            className="w-80"
            title="No projects yet"
            description="Create a project to start organizing work."
            action={<Button>New project</Button>}
          />
          <ErrorState
            className="w-80"
            onRetry={() => undefined}
            requestId="req_8f2c"
          />
          <div className="w-72 space-y-2">
            <InlineAlert tone="info" title="Info">
              A neutral note.
            </InlineAlert>
            <InlineAlert tone="success">Saved.</InlineAlert>
            <InlineAlert tone="warning" title="Careful">
              This cannot be undone.
            </InlineAlert>
            <InlineAlert tone="danger" title="Failed">
              Try again.
            </InlineAlert>
          </div>
          <div className="w-60 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        </Block>

        <Block title="Overlays">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>Short and plain</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog</DialogTitle>
                <DialogDescription>
                  Scrolls inside the viewport.
                </DialogDescription>
              </DialogHeader>
              <Input placeholder="Name" />
              <DialogFooter>
                <Button>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sheet</SheetTitle>
                <SheetDescription>From the right.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Button
            variant="outline"
            onClick={() => toastSuccess("Saved", "Everything is up to date.")}
          >
            Success toast
          </Button>
          <Button
            variant="outline"
            onClick={() => toastError("Failed", "Something went wrong.")}
          >
            Error toast
          </Button>
          <ScrollArea className="h-16 w-40 rounded-md border border-hairline p-2 text-sm">
            <p>
              Scrollable content. Scrollable content. Scrollable content.
              Scrollable content.
            </p>
          </ScrollArea>
          <Separator className="w-24" />
          <Toolbar>
            <Input className="w-40" placeholder="Filter" />
            <Button variant="outline">Sort</Button>
          </Toolbar>
        </Block>
      </div>
    </TooltipProvider>
  );
}

const panels = [
  { label: "Light · compact", theme: "", density: "compact" },
  { label: "Dark · compact", theme: "dark", density: "compact" },
  { label: "Light · comfortable", theme: "", density: "comfortable" },
  { label: "Dark · comfortable", theme: "dark", density: "comfortable" },
] as const;

export function Gallery() {
  return (
    <main className="min-h-screen bg-canvas p-6 text-ink">
      <h1 className="mb-6 font-display text-3xl">
        Primitives <span className="font-serif-italic">gallery</span>
      </h1>
      <div className="grid gap-6 xl:grid-cols-2">
        {panels.map((panel) => (
          <div
            key={panel.label}
            data-density={panel.density}
            data-testid={`panel-${panel.theme || "light"}-${panel.density}`}
            className={`${panel.theme} rounded-xl border border-hairline bg-canvas p-5 text-ink`}
          >
            <p className="mb-5 text-xs font-medium tracking-wide text-ink-3 uppercase">
              {panel.label}
            </p>
            <Specimens />
          </div>
        ))}
      </div>
    </main>
  );
}
