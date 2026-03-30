"use client";

import * as React from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChartNoAxesColumn,
  ChevronRight,
  Inbox,
  LayoutDashboard,
  MoreHorizontal,
  Search,
  Share2,
  Target,
  UserCircle2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type KanbanCard = {
  id: string;
  project: string;
  date: string;
  title: string;
  progress?: number;
  assignees: Array<{ name: string; src?: string }>;
  comments: number;
  links: number;
};

const columns: Array<{
  key: string;
  name: string;
  count: number;
  cards: KanbanCard[];
}> = [
  {
    key: "todo",
    name: "To-do",
    count: 4,
    cards: [
      {
        id: "c1",
        project: "ABC Dashboard",
        date: "Feb 14, 2027",
        title: "Create Wireframe",
        progress: 0,
        assignees: [
          { name: "Sarah", src: "https://i.pravatar.cc/80?img=1" },
          { name: "Minh", src: "https://i.pravatar.cc/80?img=2" },
        ],
        comments: 3,
        links: 2,
      },
      {
        id: "c2",
        project: "Twinkle Website",
        date: "Feb 14, 2027",
        title: "Client Feedback",
        assignees: [{ name: "Kiara", src: "https://i.pravatar.cc/80?img=3" }],
        comments: 0,
        links: 0,
      },
    ],
  },
  {
    key: "in_progress",
    name: "In Progress",
    count: 5,
    cards: [
      {
        id: "c3",
        project: "Sinen Dashboard",
        date: "Feb 14, 2027",
        title: "UI Testing",
        progress: 25,
        assignees: [
          { name: "Alex", src: "https://i.pravatar.cc/80?img=4" },
          { name: "Noah", src: "https://i.pravatar.cc/80?img=5" },
        ],
        comments: 14,
        links: 4,
      },
    ],
  },
  {
    key: "in_review",
    name: "In Review",
    count: 3,
    cards: [
      {
        id: "c4",
        project: "Twingle Website",
        date: "Feb 14, 2027",
        title: "Update Style",
        progress: 55,
        assignees: [
          { name: "Sam", src: "https://i.pravatar.cc/80?img=6" },
          { name: "Jisoo", src: "https://i.pravatar.cc/80?img=7" },
        ],
        comments: 7,
        links: 1,
      },
      {
        id: "c5",
        project: "Sosro Mobile App",
        date: "Feb 14, 2027",
        title: "Create Hi-Fi Design",
        assignees: [{ name: "Mai", src: "https://i.pravatar.cc/80?img=8" }],
        comments: 0,
        links: 0,
      },
    ],
  },
  {
    key: "completed",
    name: "Completed",
    count: 4,
    cards: [
      {
        id: "c6",
        project: "ABC Dashboard",
        date: "Feb 14, 2027",
        title: "Create Wireframe",
        progress: 100,
        assignees: [{ name: "Sarah", src: "https://i.pravatar.cc/80?img=1" }],
        comments: 3,
        links: 2,
      },
      {
        id: "c7",
        project: "ABC Dashboard",
        date: "Feb 14, 2027",
        title: "Client Feedback",
        progress: 100,
        assignees: [{ name: "Noah", src: "https://i.pravatar.cc/80?img=5" }],
        comments: 0,
        links: 0,
      },
    ],
  },
];

const calendarDays = [
  { label: "11 Feb" },
  { label: "12 Feb" },
  { label: "13 Feb" },
  { label: "14 Feb" },
  { label: "15 Feb" },
  { label: "16 Feb" },
  { label: "17 Feb" },
  { label: "18 Feb" },
] as const;

type CalendarEvent = {
  id: string;
  title: string;
  startIndex: number;
  endIndex: number;
  track: number;
  emphasis?: boolean;
};

const calendarEvents: CalendarEvent[] = [
  { id: "e1", title: "Submit Final Screens", startIndex: 0, endIndex: 0, track: 0 },
  { id: "e2", title: "Client Feedback", startIndex: 0, endIndex: 0, track: 1 },
  { id: "e3", title: "Client Feedback Meeting", startIndex: 1, endIndex: 1, track: 2 },
  { id: "e4", title: "UI Testing", startIndex: 2, endIndex: 2, track: 1 },
  { id: "e5", title: "Prototype Testing", startIndex: 3, endIndex: 3, track: 1, emphasis: true },
  { id: "e6", title: "Finalize UI Screens", startIndex: 4, endIndex: 4, track: 3 },
  { id: "e7", title: "Update Style", startIndex: 6, endIndex: 6, track: 2 },
  { id: "e8", title: "Draft Client Proposal", startIndex: 0, endIndex: 0, track: 4 },
];

function CalendarTimeline({
  days,
  events,
  stripedIndex,
}: {
  days: ReadonlyArray<{ label: string }>;
  events: CalendarEvent[];
  stripedIndex?: number;
}) {
  const cols = days.length;
  return (
    <div className="w-full">
      <div className="grid grid-cols-8 gap-3">
        {days.map((d) => (
          <div key={d.label} className="text-xs text-muted-foreground">
            {d.label}
          </div>
        ))}
      </div>

      <div className="relative mt-4 h-56 overflow-hidden rounded-lg border bg-background">
        <div className="absolute inset-0 grid grid-cols-8">
          {days.map((d, idx) => (
            <div
              key={`${d.label}-bg`}
              className={
                idx === stripedIndex
                  ? "bg-muted/20 bg-[repeating-linear-gradient(135deg,hsl(var(--border))_0px,hsl(var(--border))_1px,transparent_1px,transparent_10px)]"
                  : "bg-transparent"
              }
            />
          ))}
        </div>

        <div className="absolute inset-0 grid grid-cols-8">
          {days.map((d, idx) => (
            <div
              key={`${d.label}-col`}
              className={`${idx === 0 ? "" : "border-l"} ${
                idx === days.length - 1 ? "border-r" : ""
              }`}
            />
          ))}
        </div>

        {events.map((ev) => {
          const leftPct = (ev.startIndex / cols) * 100;
          const widthPct = ((ev.endIndex - ev.startIndex + 1) / cols) * 100;
          const top = 14 + ev.track * 30;
          const startLabel = days[ev.startIndex]?.label ?? "";

          return (
            <div
              key={ev.id}
              className={
                ev.emphasis
                  ? "absolute rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background"
                  : "absolute rounded-full bg-muted/70 px-3 py-1 text-[11px] text-foreground"
              }
              style={{
                left: `calc(${leftPct}% + 6px)`,
                width: `calc(${widthPct}% - 12px)`,
                top,
              }}
            >
              {ev.emphasis ? (
                <span className="whitespace-normal wrap-p-break-word leading-tight">
                  {startLabel} &nbsp; {ev.title}
                </span>
              ) : (
                <div className="flex min-w-0 items-start gap-2">
                  <span className="shrink-0 font-medium leading-tight">{startLabel}</span>
                  <span className="min-w-0 whitespace-normal wrap-break-word leading-tight text-muted-foreground">
                    {ev.title}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ViewToggle({ active, label, icon }: { active?: boolean; label: string; icon: React.ReactNode }) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className="h-8 gap-2"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}

function KanbanCardView({ card }: { card: KanbanCard }) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground truncate">{card.project}</span>
            <Badge variant="secondary" className="h-5 text-[10px]">
              {card.date}
            </Badge>
          </div>
          <div className="mt-1 text-sm font-medium leading-5">{card.title}</div>
        </div>
        <Button variant="ghost" size="icon-sm" className="shrink-0">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">More</span>
        </Button>
      </div>

      {typeof card.progress === "number" ? (
        <div className="mt-3">
          <div className="mb-2 text-xs text-muted-foreground">Progress : {card.progress}%</div>
          <Progress value={card.progress} />
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {card.assignees.slice(0, 3).map((a) => (
            <Avatar key={a.name} className="size-6 border">
              <AvatarImage src={a.src} alt={a.name} />
              <AvatarFallback className="text-[10px]">
                {a.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{card.comments}</span>
          <span>{card.links}</span>
        </div>
      </div>
    </Card>
  );
}

export default function Home() {
  return (
    <SidebarProvider
      defaultOpen
      style={{ "--sidebar-width": "14rem" } as React.CSSProperties}
    >
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2 pt-2">
            <Avatar className="size-9">
              <AvatarImage src="https://i.pravatar.cc/96?img=1" alt="Sarah" />
              <AvatarFallback>SS</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">Sarah Smither</div>
              <div className="text-xs text-muted-foreground truncate">sarahsmith@gmail.com</div>
            </div>
          </div>
          <Button className="mx-2" size="sm">
            + Create Task
          </Button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <CalendarDays className="size-4" />
                  <span>My Task</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Inbox className="size-4" />
                  <span className="flex w-full items-center justify-between">
                    <span>Inbox</span>
                    <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                      5
                    </Badge>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <BarChart3 className="size-4" />
                  <span>Reporting</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ChartNoAxesColumn className="size-4" />
                  <span>Portfolio</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <UserCircle2 className="size-4" />
                  <span>Accounts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Target className="size-4" />
                  <span>Goals</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Favourite</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <span>ABC Projects - Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <span>Kiara Projects - Website</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <span>Dribbble Shot</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <Separator className="mx-2" />
          <div className="px-2 pb-2 text-xs text-muted-foreground">Help Center</div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <SidebarTrigger />
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Synchro</span>
            <ChevronRight className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">My Task</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden w-[320px] md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 h-9" placeholder="Search task..." />
            </div>

            <Button variant="ghost" size="icon-sm">
              <Share2 className="size-4" />
              <span className="sr-only">Share</span>
            </Button>
            <Button variant="ghost" size="icon-sm">
              <Bell className="size-4" />
              <span className="sr-only">Notifications</span>
            </Button>

            <div className="hidden items-center -space-x-2 md:flex">
              {[1, 2, 3].map((i) => (
                <Avatar key={i} className="size-7 border">
                  <AvatarImage src={`https://i.pravatar.cc/80?img=${i + 10}`} alt={`User ${i}`} />
                  <AvatarFallback className="text-[10px]">U{i}</AvatarFallback>
                </Avatar>
              ))}
              <div className="ml-3 text-xs text-muted-foreground">+2</div>
            </div>

            <Button size="sm" className="h-9">Invite</Button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          <div>
            <div className="text-lg font-semibold">My Task</div>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Task Calendar</div>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">More</span>
              </Button>
            </div>

            <div className="mt-4">
              <CalendarTimeline days={calendarDays} events={calendarEvents} stripedIndex={5} />
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">All Task</div>
            <div className="flex items-center gap-1">
              <ViewToggle
                label="Spreadsheet"
                icon={<span className="size-4 inline-block rounded-sm border" />}
              />
              <ViewToggle
                label="Timeline"
                active
                icon={<span className="size-4 inline-block rounded-sm border bg-muted" />}
              />
              <ViewToggle
                label="Kanban"
                icon={<span className="size-4 inline-block rounded-sm border" />}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {columns.map((col) => (
              <Card key={col.key} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{col.name}</div>
                    <Badge variant="secondary" className="h-5 text-[10px]">
                      {col.count}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">More</span>
                  </Button>
                </div>

                <div className="mt-3 space-y-3">
                  {col.cards.map((card) => (
                    <KanbanCardView key={card.id} card={card} />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
