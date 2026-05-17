import { JSX } from "react";
import Link from "next/link";
import {
  FileText,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Search,
  Settings,
} from "lucide-react";
import { Button } from "@zentro/ui/shadcn/button";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <nav className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="text-sm font-bold">Z</span>
              </div>
              <span className="truncate text-sm font-semibold">Zentro</span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/chat">
                  <MessageSquare className="size-4" />
                  Chat
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks">
                  <ListTodo className="size-4" />
                  Tasks
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/docs">
                  <FileText className="size-4" />
                  Docs
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="size-4" />
            </Button>
          </div>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}
