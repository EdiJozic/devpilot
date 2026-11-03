"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Blocks,
  Bot,
  Bug,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CirclePlus,
  Code2,
  Command,
  ExternalLink,
  FileCode2,
  Filter,
  GitBranch,
  GitFork,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Pencil,
  Search,
  Send,
  Settings2,
  Sparkles,
  SquareKanban,
  Trash2,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Status = "Backlog" | "To do" | "In progress" | "In review" | "Done";
type Priority = "Low" | "Medium" | "High" | "Urgent";
type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  status: "Planning" | "In progress" | "On hold" | "Completed";
  dueDate: string;
};
type Task = {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  labels: string[];
  assignee: string;
};
type Issue = {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In progress" | "Resolved";
  reported: string;
  reportedAt?: string;
  resolvedAt?: string;
};
type Section =
  | "Overview"
  | "Projects"
  | "Tasks"
  | "Bug tracker"
  | "AI assistant"
  | "GitHub"
  | "Analytics"
  | "Settings";

const initialProjects: Project[] = [
  {
    id: "PRJ-01",
    name: "Orbit design system",
    description: "A modular component system for the next generation of our product.",
    color: "#b7f36b",
    status: "In progress",
    dueDate: "2026-11-18",
  },
  {
    id: "PRJ-02",
    name: "Pulse analytics",
    description: "Real-time product analytics, without the noise.",
    color: "#9b8cff",
    status: "In progress",
    dueDate: "2026-11-24",
  },
  {
    id: "PRJ-03",
    name: "Atlas API",
    description: "Reliable, developer-first API infrastructure.",
    color: "#67c8f3",
    status: "Planning",
    dueDate: "2026-12-02",
  },
];
const initialTasks: Task[] = [
  { id: "ORB-142", title: "Create accessible dropdown primitives", projectId: "PRJ-01", status: "In progress", priority: "High", dueDate: "2026-11-06", labels: ["Components", "A11y"], assignee: "You" },
  { id: "ORB-141", title: "Document color token architecture", projectId: "PRJ-01", status: "In review", priority: "Medium", dueDate: "2026-11-04", labels: ["Docs"], assignee: "Maya" },
  { id: "PLS-088", title: "Add cohort comparison to retention", projectId: "PRJ-02", status: "To do", priority: "Urgent", dueDate: "2026-11-05", labels: ["Analytics"], assignee: "You" },
  { id: "ORB-139", title: "Refine empty states across settings", projectId: "PRJ-01", status: "Backlog", priority: "Low", dueDate: "2026-11-13", labels: ["Polish"], assignee: "Jon" },
  { id: "PLS-084", title: "Ship event ingestion pipeline", projectId: "PRJ-02", status: "Done", priority: "High", dueDate: "2026-11-01", labels: ["Backend"], assignee: "Maya" },
  { id: "ATL-032", title: "Write API key rotation endpoint", projectId: "PRJ-03", status: "In progress", priority: "High", dueDate: "2026-11-08", labels: ["Security"], assignee: "You" },
  { id: "ORB-137", title: "Update button focus ring states", projectId: "PRJ-01", status: "Done", priority: "Medium", dueDate: "2026-10-30", labels: ["A11y"], assignee: "Jon" },
  { id: "PLS-081", title: "Review dashboard loading skeleton", projectId: "PRJ-02", status: "Backlog", priority: "Low", dueDate: "2026-11-15", labels: ["Frontend"], assignee: "Maya" },
];
const initialIssues: Issue[] = [
  { id: "BUG-028", title: "Chart tooltip clips on narrow screens", description: "On small viewports, the tooltip extends past the chart container.", projectId: "PRJ-02", severity: "High", status: "Open", reported: "Today", reportedAt: "2026-11-03T08:30:00Z" },
  { id: "BUG-027", title: "Dropdown loses focus after selection", description: "Keyboard focus is lost after choosing a menu item.", projectId: "PRJ-01", severity: "Medium", status: "In progress", reported: "Yesterday", reportedAt: "2026-11-02T10:00:00Z" },
  { id: "BUG-026", title: "Webhook retry count is off by one", description: "The retry count increments one extra time on timeout.", projectId: "PRJ-03", severity: "Low", status: "Resolved", reported: "Oct 30", reportedAt: "2026-10-30T09:00:00Z", resolvedAt: "2026-10-31T09:00:00Z" },
];

const weekData = [
  { day: "Mon", done: 9, created: 5 },
  { day: "Tue", done: 13, created: 8 },
  { day: "Wed", done: 8, created: 7 },
  { day: "Thu", done: 17, created: 6 },
  { day: "Fri", done: 12, created: 9 },
  { day: "Sat", done: 5, created: 2 },
  { day: "Sun", done: 7, created: 4 },
];
const columns: Status[] = ["Backlog", "To do", "In progress", "In review", "Done"];
const navigation: { name: Section; icon: typeof LayoutDashboard }[] = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Projects", icon: Blocks },
  { name: "Tasks", icon: SquareKanban },
  { name: "Bug tracker", icon: Bug },
];
const tools: { name: Section; icon: typeof LayoutDashboard }[] = [
  { name: "AI assistant", icon: Bot },
  { name: "GitHub", icon: GitFork },
  { name: "Analytics", icon: BarChart3 },
];
const statusClass: Record<Status, string> = {
  Backlog: "status-muted",
  "To do": "status-todo",
  "In progress": "status-progress",
  "In review": "status-review",
  Done: "status-done",
};
const priorityClass: Record<Priority, string> = {
  Low: "priority-low",
  Medium: "priority-medium",
  High: "priority-high",
  Urgent: "priority-urgent",
};
const createFormSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(100, "Keep the title under 100 characters."),
  description: z.string().max(500, "Keep the description under 500 characters.").optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Choose a valid color.").optional(),
  dueDate: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(["Backlog", "To do", "In progress", "In review", "Done"]).optional(),
  projectStatus: z.enum(["Planning", "In progress", "On hold", "Completed"]).optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  severity: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  labels: z.string().max(200, "Keep labels under 200 characters.").optional(),
});
type CreateFormValues = z.infer<typeof createFormSchema>;

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export default function Home() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("Overview");
  const [projects, setProjects] = useState(initialProjects);
  const [tasks, setTasks] = useState(initialTasks);
  const [issues, setIssues] = useState(initialIssues);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"project" | "task" | "bug" | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    void createSupabaseBrowserClient().auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setToast(`Could not verify your session: ${error.message}`);
      } else if (!data.session) {
        router.replace("/login");
      }
    }).catch((error: unknown) => {
      if (active) setToast(error instanceof Error ? error.message : "Could not verify your session.");
    });
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem("devpilot-workspace-v1");
        if (saved) {
          const data = JSON.parse(saved);
          if (Array.isArray(data.projects)) setProjects(data.projects);
          if (Array.isArray(data.tasks)) setTasks(data.tasks);
          if (Array.isArray(data.issues)) setIssues(data.issues);
        }
      } catch (error) {
        console.error("Could not load the saved workspace.", error);
      }
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (ready) {
      localStorage.setItem("devpilot-workspace-v1", JSON.stringify({ projects, tasks, issues }));
    }
  }, [projects, tasks, issues, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const projectMap = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const filteredTasks = useMemo(
    () => tasks.filter((task) => `${task.title} ${task.id} ${task.labels.join(" ")}`.toLowerCase().includes(query.toLowerCase())),
    [tasks, query],
  );
  const activeTasks = tasks.filter((task) => task.status !== "Done").length;
  const completedTasks = tasks.filter((task) => task.status === "Done").length;
  const openIssues = issues.filter((issue) => issue.status !== "Resolved").length;

  const moveTask = (id: string, status: Status) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status } : task)));
    setToast(`Task moved to ${status}`);
  };

  const handleCreate = (form: CreateFormValues) => {
    if (modal === "project") {
      if (editingProject) {
        setProjects((current) => current.map((project) => project.id === editingProject.id
          ? {
            ...project,
            name: form.title,
            description: form.description?.trim() ?? "",
            color: form.color ?? project.color,
            status: form.projectStatus ?? project.status,
            dueDate: form.dueDate ?? "",
          }
          : project));
        setToast("Project updated");
      } else {
        setProjects((current) => [{
          id: uid("PRJ"),
          name: form.title,
          description: form.description?.trim() ?? "",
          color: form.color ?? "#b7f36b",
          status: form.projectStatus ?? "Planning",
          dueDate: form.dueDate ?? "",
        }, ...current]);
        setToast("Project created");
      }
      setEditingProject(null);
    } else if (modal === "task") {
      setTasks((current) => [{
        id: uid("TASK"),
        title: form.title,
        description: form.description?.trim() ?? "",
        projectId: form.projectId ?? projects[0]?.id ?? "",
        status: form.status ?? "To do",
        priority: form.priority ?? "Medium",
        dueDate: form.dueDate ?? "",
        labels: (form.labels ?? "").split(",").map((label) => label.trim()).filter(Boolean),
        assignee: "You",
      }, ...current]);
      setToast("Task created");
    } else if (modal === "bug") {
      setIssues((current) => [{
        id: uid("BUG"),
        title: form.title,
        description: form.description?.trim() ?? "",
        projectId: form.projectId ?? projects[0]?.id ?? "",
        severity: form.severity ?? "Medium",
        status: "Open",
        reported: "Just now",
        reportedAt: new Date().toISOString(),
      }, ...current]);
      setToast("Bug reported");
    }
    setModal(null);
  };

  const askAssistant = async (prompt = assistantPrompt) => {
    const normalized = prompt.trim();
    if (!normalized) return;
    setAssistantPrompt(normalized);
    setAssistantBusy(true);
    setAssistantReply("");
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: normalized, projects, tasks, issues }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Assistant request failed.");
      setAssistantReply(result.reply);
    } catch (error) {
      setAssistantReply(error instanceof Error ? error.message : "The assistant request failed.");
    } finally {
      setAssistantBusy(false);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await createSupabaseBrowserClient().auth.signOut();
        if (error) {
          setToast(`Could not sign out: ${error.message}`);
          return;
        }
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Could not sign out.");
        return;
      }
    }
    localStorage.removeItem("devpilot-demo-session");
    router.push("/login");
  };

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><Code2 size={17} strokeWidth={2.6} /></div>
          <span className="brand-name">devpilot</span>
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setMobileMenu(false)}><X size={18} /></button>
        </div>
        <button className="workspace-switch">
          <span className="workspace-avatar">S</span>
          <span className="workspace-copy"><strong>Studio North</strong><small>Free workspace</small></span>
          <ChevronDown size={15} className="muted-icon" />
        </button>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          {navigation.map(({ name, icon: Icon }) => (
            <button key={name} onClick={() => { setSection(name); setMobileMenu(false); }} className={`nav-item ${section === name ? "nav-active" : ""}`}>
              <Icon size={17} strokeWidth={1.8} /><span>{name}</span>
              {name === "Bug tracker" && <span className="nav-count">{openIssues}</span>}
            </button>
          ))}
        </nav>
        <div className="side-label side-label-spaced">DEVELOPER TOOLS</div>
        <nav className="side-nav">
          {tools.map(({ name, icon: Icon }) => (
            <button key={name} onClick={() => { setSection(name); setMobileMenu(false); }} className={`nav-item ${section === name ? "nav-active" : ""}`}>
              <Icon size={17} strokeWidth={1.8} /><span>{name}</span>
              {name === "AI assistant" && <span className="new-indicator">NEW</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-projects">
          <div className="side-project-heading"><span className="side-label">YOUR PROJECTS</span><button aria-label="Create project" onClick={() => setModal("project")}><Plus size={15} /></button></div>
          {projects.slice(0, 4).map((project) => (
            <button key={project.id} onClick={() => setSection("Projects")} className="project-shortcut">
              <span className="project-dot" style={{ backgroundColor: project.color }} />{project.name}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="usage-card"><div className="usage-title"><Sparkles size={14} /> Your workspace</div><div className="usage-copy">You&apos;re making great progress this week.</div><div className="usage-meter"><span /></div><button onClick={() => setSection("Settings")}>View workspace <ArrowRight size={13} /></button></div>
          <button className={`nav-item ${section === "Settings" ? "nav-active" : ""}`} onClick={() => setSection("Settings")}><Settings2 size={17} /><span>Settings</span></button>
          <div className="user-row">
            <div className="user-avatar">ED</div><div className="user-copy"><strong>Edi Jozic</strong><small>Developer</small></div>
            <button className="icon-button" aria-label="Sign out" onClick={signOut}><LogOut size={15} /></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><button className="icon-button mobile-menu-button" aria-label="Open menu" onClick={() => setMobileMenu(true)}><Menu size={19} /></button><span>Studio North</span><ChevronRight size={14} /><strong>{section}</strong></div>
          <div className="topbar-actions">
            <button className="search-trigger" onClick={() => document.getElementById("global-search")?.focus()}><Search size={15} /><span>Search anything...</span><kbd><Command size={11} /> K</kbd></button>
            <button className="icon-button topbar-icon" aria-label="Notifications" onClick={() => setToast("You’re all caught up")}><Bell size={17} /><i /></button>
            <button className="topbar-avatar" aria-label="Open profile">ED</button>
          </div>
        </header>
        <div className="page-scroll">
          {section === "Overview" && <Overview projects={projects} tasks={tasks} projectMap={projectMap} activeTasks={activeTasks} completedTasks={completedTasks} openIssues={openIssues} onNavigate={setSection} onCreate={setModal} onMove={moveTask} />}
          {section === "Projects" && <ProjectsPage projects={projects} tasks={tasks} onCreate={() => { setEditingProject(null); setModal("project"); }} onEdit={(project) => { setEditingProject(project); setModal("project"); }} onDelete={(id) => { const project = projectMap.get(id); if (!project || !window.confirm(`Delete "${project.name}" and all its tasks and bugs?`)) return; setProjects((current) => current.filter((item) => item.id !== id)); setTasks((current) => current.filter((task) => task.projectId !== id)); setIssues((current) => current.filter((issue) => issue.projectId !== id)); setToast("Project and related items removed"); }} onOpen={(id) => { setSelectedProjectId(id); setSection("Tasks"); }} />}
          {section === "Tasks" && <TasksPage tasks={filteredTasks} projects={projectMap} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} query={query} setQuery={setQuery} onCreate={() => setModal("task")} onMove={moveTask} />}
          {section === "Bug tracker" && <BugsPage issues={issues} projects={projectMap} onCreate={() => setModal("bug")} onResolve={(id) => {           setIssues((current) => current.map((issue) => issue.id === id ? { ...issue, status: "Resolved", resolvedAt: new Date().toISOString() } : issue)); setToast("Bug marked as resolved"); }} />}
          {section === "AI assistant" && <AssistantPage prompt={assistantPrompt} setPrompt={setAssistantPrompt} reply={assistantReply} busy={assistantBusy} onAsk={askAssistant} />}
          {section === "GitHub" && <GitHubPage projects={projects} />}
          {section === "Analytics" && <AnalyticsPage tasks={tasks} issues={issues} projects={projects} />}
          {section === "Settings" && <SettingsPage onSignOut={signOut} />}
        </div>
      </main>

      {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      {modal && <CreateModal type={modal} projects={projects} defaultProjectId={selectedProjectId} editingProject={modal === "project" ? editingProject : null} onClose={() => { setModal(null); setEditingProject(null); }} onSubmit={handleCreate} />}
      {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

function Overview({ projects, tasks, projectMap, activeTasks, completedTasks, openIssues, onNavigate, onCreate, onMove }: {
  projects: Project[]; tasks: Task[]; projectMap: Map<string, Project>; activeTasks: number; completedTasks: number; openIssues: number;
  onNavigate: (section: Section) => void; onCreate: (modal: "project" | "task" | "bug") => void; onMove: (id: string, status: Status) => void;
}) {
  const stats = [
    { label: "Active tasks", value: activeTasks, delta: "+12%", detail: "vs. last week", icon: SquareKanban, color: "lime", trend: "up" },
    { label: "Completed", value: completedTasks, delta: "+8%", detail: "vs. last week", icon: CheckCircle2, color: "violet", trend: "up" },
    { label: "Open bugs", value: openIssues, delta: "−2", detail: "since last week", icon: Bug, color: "orange", trend: "down" },
    { label: "Projects", value: projects.length.toString().padStart(2, "0"), delta: "2 active", detail: "1 in planning", icon: Blocks, color: "blue", trend: "flat" },
  ];
  return (
    <>
      <PageHeading eyebrow="TUESDAY, NOVEMBER 3, 2026" title="Good morning, Edi" description="Here’s what’s happening across your workspace." action={<button className="button-primary" onClick={() => onCreate("task")}><Plus size={16} /> New task</button>} />
      <div className="stats-grid">{stats.map(({ label, value, delta, detail, icon: Icon, color, trend }) => <div className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className={`stat-icon ${color}`}><Icon size={16} /></span></div><div className="stat-value">{value}</div><div className="stat-foot"><span className={`delta ${trend}`}>{trend === "down" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{delta}</span><span>{detail}</span></div></div>)}</div>
      <div className="dashboard-grid">
        <section className="panel productivity-panel">
          <div className="panel-header"><div><h2>Productivity</h2><p>Tasks completed this week</p></div><button className="select-button">This week <ChevronDown size={14} /></button></div>
          <div className="chart-summary"><strong>71</strong><span>tasks completed</span><span className="chart-change"><ArrowUpRight size={13} /> 18.4%</span></div>
          <div className="productivity-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekData} margin={{ top: 10, right: 4, left: -26, bottom: 0 }}><defs><linearGradient id="doneFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b7f36b" stopOpacity={0.22} /><stop offset="100%" stopColor="#b7f36b" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#25282b" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#777d82", fontSize: 11 }} dy={10} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#777d82", fontSize: 11 }} /><Tooltip contentStyle={{ background: "#191c1e", border: "1px solid #303437", borderRadius: 9, color: "#f4f4ef", fontSize: 12 }} /><Area type="monotone" dataKey="done" stroke="#b7f36b" strokeWidth={2.5} fill="url(#doneFill)" activeDot={{ r: 4, fill: "#b7f36b", stroke: "#121414", strokeWidth: 3 }} /></AreaChart></ResponsiveContainer></div>
          <div className="chart-legend"><span><i className="legend-lime" />Completed</span><span><i className="legend-muted" />Daily average <b>10.1</b></span></div>
        </section>
        <section className="panel project-progress-panel">
          <div className="panel-header"><div><h2>Project progress</h2><p>Keep the momentum going</p></div><button className="icon-button" aria-label="View all projects" onClick={() => onNavigate("Projects")}><ArrowRight size={17} /></button></div>
          <div className="project-progress-list">{projects.slice(0, 4).map((project, index) => {
            const projectTasks = tasks.filter((task) => task.projectId === project.id);
            const done = projectTasks.filter((task) => task.status === "Done").length;
            const percent = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : [68, 42, 18][index % 3];
            return <div className="project-progress-item" key={project.id}><div className="progress-project-head"><span className="project-dot" style={{ backgroundColor: project.color }} /><strong>{project.name}</strong><span>{percent}%</span></div><div className="progress-track"><span style={{ width: `${percent}%`, background: project.color }} /></div><div className="progress-project-meta"><span>{project.status}</span><span>{project.dueDate ? `Due ${new Date(`${project.dueDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "No deadline"}</span></div></div>;
          })}</div>
          <button className="text-link project-see-all" onClick={() => onNavigate("Projects")}>All projects <ArrowRight size={14} /></button>
        </section>
      </div>
      <div className="dashboard-grid lower-grid">
        <section className="panel tasks-panel">
          <div className="panel-header"><div><h2>My tasks</h2><p>Your focus for today</p></div><button className="text-link" onClick={() => onNavigate("Tasks")}>View board <ArrowRight size={14} /></button></div>
          <div className="task-table">
            <div className="task-table-head"><span>TASK</span><span>PROJECT</span><span>PRIORITY</span><span>STATUS</span></div>
            {tasks.filter((task) => task.assignee === "You" && task.status !== "Done").slice(0, 4).map((task) => <div className="task-table-row" key={task.id}><span className="task-name-cell"><span className="task-checkbox" /><span><small>{task.id}</small><strong>{task.title}</strong></span></span><span className="table-project"><i className="project-dot" style={{ backgroundColor: projectMap.get(task.projectId)?.color }} />{projectMap.get(task.projectId)?.name}</span><span><PriorityLabel priority={task.priority} /></span><span><select className={`status-select ${statusClass[task.status]}`} aria-label={`Set status for ${task.title}`} value={task.status} onChange={(event) => onMove(task.id, event.target.value as Status)}>{columns.map((status) => <option key={status}>{status}</option>)}</select></span></div>)}
          </div>
          <button className="task-add-row" onClick={() => onCreate("task")}><Plus size={15} /> Add a task</button>
        </section>
        <section className="panel activity-panel">
          <div className="panel-header"><div><h2>Activity</h2><p>Latest updates from your team</p></div><button className="icon-button" aria-label="More activity options"><MoreHorizontal size={18} /></button></div>
          <div className="activity-feed">
            <ActivityItem initials="M" color="purple" text={<><b>Maya Chen</b> completed <strong>Ship event ingestion pipeline</strong></>} time="12 min ago" icon={<Check size={11} />} />
            <ActivityItem initials="ED" color="lime" text={<><b>You</b> moved <strong>Add cohort comparison to retention</strong> to To do</>} time="1 hour ago" icon={<ArrowRight size={11} />} />
            <ActivityItem initials="J" color="blue" text={<><b>Jon Bell</b> created a new task in <strong>Orbit design system</strong></>} time="3 hours ago" icon={<Plus size={11} />} />
            <ActivityItem initials="M" color="purple" text={<><b>Maya Chen</b> reported <strong>Chart tooltip clips on narrow screens</strong></>} time="Yesterday" icon={<Bug size={11} />} />
          </div>
          <button className="text-link activity-link" onClick={() => onNavigate("Analytics")}>View activity <ArrowRight size={14} /></button>
        </section>
      </div>
      <div className="dashboard-bottom-note"><Sparkles size={14} /><span>Nice work — you’re <strong>18% more productive</strong> than last week.</span><button onClick={() => onNavigate("Analytics")}>See your insights <ArrowRight size={13} /></button></div>
    </>
  );
}

function ActivityItem({ initials, color, text, time, icon }: { initials: string; color: string; text: ReactNode; time: string; icon: ReactNode }) {
  return <div className="activity-item"><div className={`activity-avatar ${color}`}>{initials}</div><div className="activity-copy"><p>{text}</p><small>{time}</small></div><span className={`activity-event ${color}`}>{icon}</span></div>;
}

function PriorityLabel({ priority }: { priority: Priority }) {
  const Icon = priority === "Urgent" || priority === "High" ? ArrowUpRight : priority === "Low" ? ArrowDownRight : ArrowRight;
  return <span className={`priority-label ${priorityClass[priority]}`}><Icon size={13} />{priority}</span>;
}

function ProjectsPage({ projects, tasks, onCreate, onEdit, onDelete, onOpen }: { projects: Project[]; tasks: Task[]; onCreate: () => void; onEdit: (project: Project) => void; onDelete: (id: string) => void; onOpen: (projectId: string) => void }) {
  return <><PageHeading eyebrow="YOUR WORKSPACE" title="Projects" description={`${projects.length} projects across your workspace.`} action={<button className="button-primary" onClick={onCreate}><Plus size={16} /> New project</button>} /><div className="project-card-grid">{projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    const done = projectTasks.filter((task) => task.status === "Done").length;
    const percent = projectTasks.length ? Math.round(done / projectTasks.length * 100) : 0;
    return <article className="project-card" key={project.id}><div className="project-card-top"><span className="project-icon" style={{ color: project.color, background: `${project.color}18` }}><FileCode2 size={18} /></span><div className="project-card-actions"><button className="icon-button" aria-label={`Edit ${project.name}`} onClick={() => onEdit(project)}><Pencil size={14} /></button><button className="icon-button" aria-label={`Delete ${project.name}`} onClick={() => onDelete(project.id)}><Trash2 size={14} /></button></div></div><div className="project-card-status"><span className="project-dot" style={{ backgroundColor: project.color }} />{project.status}</div><h2>{project.name}</h2><p>{project.description || "No description yet."}</p><div className="project-card-progress"><div><span>Progress</span><b>{percent}%</b></div><div className="progress-track"><span style={{ width: `${percent}%`, background: project.color }} /></div></div><div className="project-card-footer"><span><SquareKanban size={14} />{projectTasks.length} tasks</span><span><CalendarDays size={14} />{project.dueDate || "No deadline"}</span></div><button className="project-card-open" onClick={() => onOpen(project.id)}>Open workspace <ArrowRight size={14} /></button></article>;
  })}<button className="project-card project-create-card" onClick={onCreate}><span><CirclePlus size={22} /></span><strong>Create a project</strong><small>Start organizing your next big idea.</small></button></div></>;
}

function TasksPage({ tasks, projects, selectedProjectId, setSelectedProjectId, query, setQuery, onCreate, onMove }: { tasks: Task[]; projects: Map<string, Project>; selectedProjectId: string; setSelectedProjectId: (projectId: string) => void; query: string; setQuery: (query: string) => void; onCreate: () => void; onMove: (id: string, status: Status) => void }) {
  const [priorityFilter, setPriorityFilter] = useState("All priorities");
  const visible = tasks.filter((task) => (priorityFilter === "All priorities" || task.priority === priorityFilter) && (!selectedProjectId || task.projectId === selectedProjectId));
  const currentProject = selectedProjectId ? projects.get(selectedProjectId) : undefined;
  return <><PageHeading eyebrow="TASK MANAGEMENT" title={currentProject?.name ?? "Task board"} description={currentProject ? `Focused workspace · ${currentProject.description || "No project description."}` : "Plan, prioritize, and keep your work moving."} action={<button className="button-primary" onClick={onCreate}><Plus size={16} /> New task</button>} />
    <div className="board-toolbar"><div className="board-tabs"><button className="board-tab active"><SquareKanban size={15} />Board</button><button className="board-tab"><ListFilter size={15} />List</button></div><div className="board-tools"><label className="inline-search"><Search size={15} /><input id="global-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." /></label><label className="filter-select"><Filter size={14} /><select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}><option value="">All projects</option>{[...projects.values()].map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label><label className="filter-select"><ListFilter size={14} /><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option>All priorities</option><option>Urgent</option><option>High</option><option>Medium</option><option>Low</option></select></label><button className="avatar-stack" aria-label="Filter by assignee"><span>ED</span><span>M</span><span>J</span><ChevronDown size={12} /></button></div></div>
    <div className="kanban-board">{columns.map((column) => {
      const columnTasks = visible.filter((task) => task.status === column);
      return <section className="kanban-column" key={column} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/task-id"); if (id) onMove(id, column); }}>
        <div className="kanban-column-head"><span className={`column-indicator ${statusClass[column]}`} /><strong>{column}</strong><span className="column-count">{columnTasks.length}</span><button className="icon-button small-icon" onClick={onCreate} aria-label={`Add task to ${column}`}><Plus size={15} /></button></div>
        <div className="kanban-cards">{columnTasks.map((task) => <article className="kanban-card" key={task.id} draggable onDragStart={(event) => { event.dataTransfer.setData("text/task-id", task.id); event.dataTransfer.effectAllowed = "move"; }}><div className="kanban-card-id">{task.id}<button className="icon-button small-icon" aria-label="Task options"><MoreHorizontal size={15} /></button></div><h3>{task.title}</h3>{task.description && <p className="kanban-description">{task.description}</p>}<div className="kanban-card-tags">{task.labels.slice(0, 2).map((label) => <span key={label}>{label}</span>)}</div><div className="kanban-card-bottom"><PriorityLabel priority={task.priority} /><span className="kanban-project"><i className="project-dot" style={{ background: projects.get(task.projectId)?.color }} />{projects.get(task.projectId)?.name ?? "Project"}</span></div><div className="kanban-card-footer"><span><CalendarDays size={12} />{task.dueDate ? new Date(`${task.dueDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No date"}</span><span className="mini-avatar">{task.assignee === "You" ? "ED" : task.assignee[0]}</span></div><select className="mobile-status" aria-label={`Move ${task.id}`} value={task.status} onChange={(event) => onMove(task.id, event.target.value as Status)}>{columns.map((status) => <option key={status}>{status}</option>)}</select></article>)}
        <button className="kanban-add" onClick={onCreate}><Plus size={14} /> Add task</button></div></section>;
    })}</div></>;
}

function BugsPage({ issues, projects, onCreate, onResolve }: { issues: Issue[]; projects: Map<string, Project>; onCreate: () => void; onResolve: (id: string) => void }) {
  const [filter, setFilter] = useState("All issues");
  const filtered = issues.filter((issue) => filter === "All issues" || issue.status === filter);
  return <><PageHeading eyebrow="QUALITY & RELIABILITY" title="Bug tracker" description="Catch issues early and keep every release healthy." action={<button className="button-primary" onClick={onCreate}><Plus size={16} /> Report a bug</button>} /><div className="bug-overview"><div><span className="bug-stat-icon red"><Bug size={17} /></span><span><small>Unresolved</small><strong>{issues.filter((issue) => issue.status !== "Resolved").length}</strong></span></div><div><span className="bug-stat-icon amber"><Activity size={17} /></span><span><small>In progress</small><strong>{issues.filter((issue) => issue.status === "In progress").length}</strong></span></div><div><span className="bug-stat-icon green"><CheckCircle2 size={17} /></span><span><small>Resolved</small><strong>{issues.filter((issue) => issue.status === "Resolved").length}</strong></span></div><div className="bug-health"><span className="health-dot" /> All systems operational</div></div><section className="panel bug-table-panel"><div className="panel-header"><div><h2>Reported issues</h2><p>Track and resolve bugs across your projects.</p></div><select className="select-button" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All issues</option><option>Open</option><option>In progress</option><option>Resolved</option></select></div><div className="bug-table"><div className="bug-table-head"><span>ISSUE</span><span>PROJECT</span><span>SEVERITY</span><span>STATUS</span><span>REPORTED</span><span /></div>{filtered.map((issue) => <div className="bug-table-row" key={issue.id}><span className="bug-title"><span className={`bug-id ${issue.status === "Resolved" ? "resolved" : ""}`}>{issue.id}</span><strong>{issue.title}</strong></span><span className="table-project"><i className="project-dot" style={{ background: projects.get(issue.projectId)?.color }} />{projects.get(issue.projectId)?.name ?? "Project"}</span><span><span className={`severity severity-${issue.severity.toLowerCase()}`}><i />{issue.severity}</span></span><span><span className={`bug-status bug-status-${issue.status.toLowerCase().replace(" ", "-")}`}>{issue.status}</span></span><span className="reported-date">{issue.reported}</span><span>{issue.status !== "Resolved" && <button className="resolve-button" onClick={() => onResolve(issue.id)}><Check size={13} /> Resolve</button>}</span></div>)}{filtered.length === 0 && <div className="empty-row">No issues match this filter.</div>}</div></section><div className="bug-tip"><Sparkles size={16} /><span><strong>Pro tip:</strong> Good bug reports include steps to reproduce and expected behavior.</span><button>Learn more <ArrowRight size={13} /></button></div></>;
}

function AssistantPage({ prompt, setPrompt, reply, busy, onAsk }: { prompt: string; setPrompt: (prompt: string) => void; reply: string; busy: boolean; onAsk: (prompt?: string) => void }) {
  const [aiConfigured, setAiConfigured] = useState(false);
  useEffect(() => {
    let active = true;
    void fetch("/api/assistant")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not check the AI provider configuration.");
        return response.json();
      })
      .then((result) => { if (active) setAiConfigured(Boolean(result.configured)); })
      .catch((error: unknown) => { console.error(error); });
    return () => { active = false; };
  }, []);
  const suggestions = [
    { icon: BarChart3, title: "Summarize project progress", prompt: "Summarize the current progress across my projects and call out anything at risk." },
    { icon: ArrowUpRight, title: "Suggest task priorities", prompt: "Review my open tasks and suggest what I should prioritize today." },
    { icon: GitBranch, title: "Create a development roadmap", prompt: "Create a practical 2-week roadmap for my current projects." },
    { icon: Bug, title: "Investigate a bug", prompt: "Suggest likely causes and a debugging checklist for the open chart tooltip bug." },
  ];
  return <><PageHeading eyebrow="YOUR DEVELOPMENT COPILOT" title="AI assistant" description="A little extra clarity for your next big move." action={<span className="demo-mode-chip"><span />{aiConfigured ? "AI CONNECTED" : "DEMO MODE"}</span>} /><div className="assistant-layout"><section className="assistant-main panel"><div className="assistant-welcome"><div className="assistant-orb"><Sparkles size={22} /></div><div><h2>Hey Edi, what are we working on?</h2><p>I know your projects, tasks, and bugs. Ask me anything.</p></div></div><div className="assistant-prompts">{suggestions.map(({ icon: Icon, title, prompt: itemPrompt }) => <button key={title} className="assistant-prompt" onClick={() => onAsk(itemPrompt)}><Icon size={16} /><span>{title}</span><ArrowRight size={14} /></button>)}</div>{reply && <div className="assistant-answer"><div className="answer-label"><Sparkles size={14} /> DEVPILOT AI <span>Just now</span></div><p>{reply}</p></div>}<form className="assistant-input" onSubmit={(event) => { event.preventDefault(); onAsk(); }}><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask about your projects, tasks, or bugs..." rows={2} /><div className="assistant-input-footer"><span><Command size={12} /> Enter to send</span><button disabled={busy || !prompt.trim()} aria-label="Send prompt">{busy ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />}</button></div></form></section><aside className="assistant-side"><div className="assistant-side-card"><div className="assistant-side-icon"><Activity size={18} /></div><h3>Your week at a glance</h3><p>You completed <strong>{weekData.reduce((sum, day) => sum + day.done, 0)} tasks</strong> this week. That’s your best pace in the last month.</p><div className="assistant-side-stat"><span>Most focused project</span><strong>Orbit design system</strong></div><button onClick={() => onAsk("Give me a personalized summary of this week's development progress.")}>Get a full summary <ArrowRight size={14} /></button></div><div className="assistant-privacy"><CircleHelp size={15} /><p>Your workspace context stays private. Configure an AI key to use your own provider.</p></div></aside></div></>;
}

type GitHubRepository = { id: number; name: string; description: string | null; language: string | null; url: string; updatedAt: string; defaultBranch: string };
type GitHubDetails = {
  commits: { sha: string; message: string; author: string; date: string; url: string }[];
  branches: { name: string; protected: boolean }[];
  pullRequests: { number: number; title: string; url: string; author: string }[];
};

function GitHubPage({ projects }: { projects: Project[] }) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState(false);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [selectedRepository, setSelectedRepository] = useState("");
  const [details, setDetails] = useState<GitHubDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [linkedProjects, setLinkedProjects] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem("devpilot-github-project-links");
        if (saved) setLinkedProjects(JSON.parse(saved));
      } catch (loadError) {
        console.error("Could not load repository project links.", loadError);
      }
    });
    void (async () => {
      try {
        const response = await fetch("/api/github/status");
        if (!response.ok) throw new Error("Could not check the GitHub connection.");
        const status = await response.json();
        if (!active) return;
        setConfigured(Boolean(status.configured));
        setConnected(Boolean(status.connected));
        if (status.connected) {
          const reposResponse = await fetch("/api/github/repos");
          const result = await reposResponse.json();
          if (!reposResponse.ok) throw new Error(result.error ?? "Could not load repositories.");
          if (!active) return;
          setRepositories(result.repositories);
          setSelectedRepository(result.repositories[0]?.name ?? "");
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load GitHub data.");
      }
    })();
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!selectedRepository || !connected) return;
    let active = true;
    void (async () => {
      setLoadingDetails(true);
      setError("");
      setDetails(null);
      try {
        const response = await fetch(`/api/github/repos?repository=${encodeURIComponent(selectedRepository)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not load repository activity.");
        if (active) setDetails(result);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load repository activity.");
      } finally {
        if (active) setLoadingDetails(false);
      }
    })();
    return () => { active = false; };
  }, [selectedRepository, connected]);

  const connect = async () => {
    setConnecting(true);
    setError("");
    try {
      const response = await fetch("/api/github/status");
      const data = await response.json();
      if (!data.configured) {
        setError("GitHub OAuth isn’t configured yet. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to your server environment.");
      } else {
        window.location.assign(new URL("/api/github/connect", window.location.origin).toString());
      }
    } catch {
      setError("Could not check the GitHub connection. Please try again.");
    } finally {
      setConnecting(false);
    }
  };
  const saveProjectLink = (repository: string, projectId: string) => {
    const nextLinks = { ...linkedProjects };
    if (projectId) nextLinks[repository] = projectId;
    else delete nextLinks[repository];
    setLinkedProjects(nextLinks);
    localStorage.setItem("devpilot-github-project-links", JSON.stringify(nextLinks));
  };
  const disconnect = async () => {
    const response = await fetch("/api/github/connect", { method: "DELETE" });
    if (!response.ok) {
      setError("Could not disconnect GitHub. Please try again.");
      return;
    }
    setConnected(false);
    setRepositories([]);
    setDetails(null);
    setSelectedRepository("");
    setError("");
  };
  return <><PageHeading eyebrow="SHIP WITH CONFIDENCE" title="GitHub" description="Bring your repositories and project activity together." action={connected ? <span className="demo-mode-chip"><span />CONNECTED</span> : undefined} />{connected ? <div className="github-live-layout"><section className="panel github-repo-panel"><div className="panel-header"><div><h2>Your repositories</h2><p>{repositories.length} recently updated</p></div><button className="icon-button" aria-label="Disconnect GitHub" onClick={disconnect}><LogOut size={15} /></button></div><div className="github-repo-list">{repositories.map((repository) => <button key={repository.id} className={`github-repo-option ${selectedRepository === repository.name ? "selected" : ""}`} onClick={() => setSelectedRepository(repository.name)}><span className="repo-icon"><Code2 size={13} /></span><span><strong>{repository.name}</strong><small>{repository.language ?? "Repository"} · {new Date(repository.updatedAt).toLocaleDateString()}</small></span><ChevronRight size={14} /></button>)}{repositories.length === 0 && <p className="github-empty">No repositories were returned for this account.</p>}</div>{selectedRepository && <label className="repo-project-link"><span>LINK TO PROJECT</span><select value={linkedProjects[selectedRepository] ?? ""} onChange={(event) => saveProjectLink(selectedRepository, event.target.value)}><option value="">No project linked</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>}</section><section className="panel github-activity-panel"><div className="panel-header"><div><h2>{selectedRepository || "Repository activity"}</h2><p>Recent commits, branches, and open pull requests</p></div>{repositories.find((repo) => repo.name === selectedRepository) && <a className="icon-button" href={repositories.find((repo) => repo.name === selectedRepository)?.url} target="_blank" rel="noreferrer" aria-label="Open on GitHub"><ExternalLink size={15} /></a>}</div>{error && <div className="integration-error">{error}</div>}{loadingDetails && <div className="github-loading"><LoaderCircle size={16} className="spin" />Loading repository activity…</div>}{details && <div className="github-detail-grid"><div><h3><Activity size={14} /> Recent commits</h3>{details.commits.map((commit) => <a className="github-detail-row" key={commit.sha} href={commit.url} target="_blank" rel="noreferrer"><span><strong>{commit.message}</strong><small>{commit.author} · {new Date(commit.date).toLocaleDateString()}</small></span><code>{commit.sha}</code></a>)}{details.commits.length === 0 && <p className="github-empty">No recent commits.</p>}</div><div><h3><GitBranch size={14} /> Branches <span>{details.branches.length}</span></h3><div className="github-branch-list">{details.branches.map((branch) => <span key={branch.name}><GitBranch size={12} />{branch.name}{branch.protected && <i>protected</i>}</span>)}</div></div><div><h3><CheckCircle2 size={14} /> Open pull requests <span>{details.pullRequests.length}</span></h3>{details.pullRequests.map((pull) => <a className="github-detail-row" key={pull.number} href={pull.url} target="_blank" rel="noreferrer"><span><strong>#{pull.number} {pull.title}</strong><small>Opened by {pull.author}</small></span><ExternalLink size={13} /></a>)}{details.pullRequests.length === 0 && <p className="github-empty">No open pull requests.</p>}</div></div>}</section></div> : <div className="github-connect-card"><div className="github-glow" /><div className="github-logo"><GitFork size={34} /></div><div className="github-connect-copy"><span className="eyebrow">GITHUB INTEGRATION</span><h2>Connect your code to your workflow.</h2><p>Link repositories to projects, follow commit activity, and see pull requests without leaving DevPilot.</p><button className="button-primary" onClick={connect} disabled={connecting}>{connecting ? <LoaderCircle size={15} className="spin" /> : <GitFork size={16} />}Connect GitHub <ArrowRight size={14} /></button>{error && <div className="integration-error">{error}</div>}{!configured && <div className="github-config-note">OAuth credentials are not configured on this server yet.</div>}</div><div className="github-preview"><div className="preview-top"><span className="preview-dot" /><span className="preview-dot" /><span className="preview-dot" /><span>Sample repository preview</span></div><div className="preview-repo"><span className="repo-icon"><Code2 size={13} /></span><span><strong>studio-north/orbit-ui</strong><small><i className="repo-language" />TypeScript · Updated 2h ago</small></span><span className="repo-branch"><GitBranch size={12} />main</span></div><div className="preview-repo"><span className="repo-icon"><Code2 size={13} /></span><span><strong>studio-north/pulse-api</strong><small><i className="repo-language violet-language" />Go · Updated yesterday</small></span><span className="repo-branch"><GitBranch size={12} />main</span></div><div className="preview-pr"><span className="pr-status" /><span><strong>#84 Add retention cohort filters</strong><small>Sample · pull request preview</small></span><ExternalLink size={13} /></div><div className="preview-blur" /></div></div>}<div className="github-feature-grid"><div><GitBranch size={18} /><strong>Repository context</strong><p>Connect a repository to its project workspace.</p></div><div><Activity size={18} /><strong>Commit activity</strong><p>Stay in sync with what your team ships.</p></div><div><CheckCircle2 size={18} /><strong>Pull request health</strong><p>Track review status and CI checks at a glance.</p></div></div></>;
}

function AnalyticsPage({ tasks, issues, projects }: { tasks: Task[]; issues: Issue[]; projects: Project[] }) {
  const done = tasks.filter((task) => task.status === "Done").length;
  const resolvedDurations = issues.flatMap((issue) => {
    if (issue.status !== "Resolved" || !issue.reportedAt || !issue.resolvedAt) return [];
    const hours = (new Date(issue.resolvedAt).getTime() - new Date(issue.reportedAt).getTime()) / 3_600_000;
    return hours >= 0 ? [hours] : [];
  });
  const averageBugResolution = resolvedDurations.length
    ? Math.round(resolvedDurations.reduce((total, hours) => total + hours, 0) / resolvedDurations.length)
    : 0;
  const priorityData = ["Urgent", "High", "Medium", "Low"].map((priority) => ({ priority, count: tasks.filter((task) => task.priority === priority).length }));
  const data = [
    { week: "Oct 12", tasks: 26 },
    { week: "Oct 19", tasks: 38 },
    { week: "Oct 26", tasks: 32 },
    { week: "Nov 2", tasks: Math.max(weekData.reduce((sum, day) => sum + day.done, 0), done) },
  ];
  return <><PageHeading eyebrow="YOUR WORK, IN FOCUS" title="Analytics" description="A clearer picture of your team’s momentum." action={<button className="select-button">Last 4 weeks <ChevronDown size={14} /></button>} /><div className="analytics-kpis"><div className="analytics-kpi"><small>Tasks completed</small><strong>{data[data.length - 1].tasks}</strong><span className="kpi-up"><ArrowUpRight size={13} /> 18.4% vs. previous</span></div><div className="analytics-kpi"><small>Avg. completion rate</small><strong>{projects.length ? Math.round(done / Math.max(tasks.length, 1) * 100) : 0}<i>%</i></strong><span className="kpi-up"><ArrowUpRight size={13} /> 6.2% vs. previous</span></div><div className="analytics-kpi"><small>Open bugs</small><strong>{issues.filter((issue) => issue.status !== "Resolved").length}</strong><span className="kpi-neutral"><ArrowDownRight size={13} /> 2 fewer this week</span></div>  <div className="analytics-kpi"><small>Avg. bug resolution</small><strong>{averageBugResolution}<i>h</i></strong><span className="kpi-neutral">Across resolved issues</span></div></div><div className="analytics-chart-grid"><section className="panel analytics-main-chart"><div className="panel-header"><div><h2>Tasks completed over time</h2><p>Nice work — you’re building momentum.</p></div><span className="chart-change"><ArrowUpRight size={13} /> 18.4%</span></div><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}><defs><linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b7f36b" stopOpacity={0.2} /><stop offset="100%" stopColor="#b7f36b" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#25282b" vertical={false} /><XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "#777d82", fontSize: 11 }} dy={10} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#777d82", fontSize: 11 }} /><Tooltip contentStyle={{ background: "#191c1e", border: "1px solid #303437", borderRadius: 9, color: "#f4f4ef", fontSize: 12 }} /><Area type="monotone" dataKey="tasks" stroke="#b7f36b" strokeWidth={2.5} fill="url(#analyticsFill)" /></AreaChart></ResponsiveContainer></div></section><section className="panel priority-chart-panel"><div className="panel-header"><div><h2>Tasks by priority</h2><p>Current task distribution</p></div></div><div className="priority-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={priorityData} layout="vertical" margin={{ left: 2, right: 16, top: 8, bottom: 0 }}><CartesianGrid stroke="#25282b" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="priority" tickLine={false} axisLine={false} tick={{ fill: "#999ea2", fontSize: 11 }} width={52} /><Tooltip cursor={{ fill: "#ffffff08" }} contentStyle={{ background: "#191c1e", border: "1px solid #303437", borderRadius: 9, color: "#f4f4ef", fontSize: 12 }} /><Bar dataKey="count" fill="#b7f36b" radius={[0, 5, 5, 0]} barSize={11} /></BarChart></ResponsiveContainer></div><div className="priority-chart-foot"><span><i />{tasks.length} total tasks</span><span><CheckCircle2 size={13} />{done} completed</span></div></section></div><section className="panel project-analytics"><div className="panel-header"><div><h2>Project completion</h2><p>Progress by project</p></div></div>{projects.map((project) => { const related = tasks.filter((task) => task.projectId === project.id); const progress = related.length ? Math.round(related.filter((task) => task.status === "Done").length / related.length * 100) : 0; return <div className="analytics-project-row" key={project.id}><span className="project-dot" style={{ background: project.color }} /><strong>{project.name}</strong><div className="progress-track"><span style={{ width: `${progress}%`, background: project.color }} /></div><b>{progress}%</b><small>{related.length} tasks</small></div>; })}</section></>;
}

function SettingsPage({ onSignOut }: { onSignOut: () => void }) {
  return <><PageHeading eyebrow="PREFERENCES" title="Settings" description="Manage your account and workspace preferences." /><section className="panel settings-panel"><div className="settings-section"><div><h2>Profile</h2><p>Your personal details and account access.</p></div><div className="settings-profile"><div className="user-avatar large">ED</div><div><strong>Edi Jozic</strong><span>edi@example.com · Demo account</span></div><button className="button-secondary">Edit profile</button></div></div><div className="settings-section"><div><h2>Workspace</h2><p>Make DevPilot work the way your team does.</p></div><div className="settings-row"><div><strong>Studio North</strong><span>Free plan · Demo workspace data is saved in this browser.</span></div><span className="settings-badge">Free plan</span></div></div><div className="settings-section"><div><h2>Integrations</h2><p>Connect the tools you use every day.</p></div><div className="settings-row"><div className="integration-name"><GitFork size={17} /><span><strong>GitHub</strong><small>Not connected</small></span></div><a className="button-secondary" href="/api/github/connect">Configure</a></div><div className="settings-row"><div className="integration-name"><Sparkles size={17} /><span><strong>AI provider</strong><small>Demo responses active</small></span></div><span className="settings-badge">Demo mode</span></div></div><div className="settings-section danger-zone"><div><h2>Session</h2><p>Sign out of your current session.</p></div><button className="button-secondary" onClick={onSignOut}><LogOut size={15} />Sign out</button></div></section></>;
}

function CreateModal({ type, projects, defaultProjectId, editingProject, onClose, onSubmit }: { type: "project" | "task" | "bug"; projects: Project[]; defaultProjectId: string; editingProject: Project | null; onClose: () => void; onSubmit: (values: CreateFormValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      title: "",
      description: "",
      color: "#b7f36b",
      dueDate: "",
      projectId: defaultProjectId || projects[0]?.id || "",
      status: "To do",
      projectStatus: editingProject?.status ?? "Planning",
      priority: "Medium",
      severity: "Medium",
      labels: "",
      ...(editingProject ? {
        title: editingProject.name,
        description: editingProject.description,
        color: editingProject.color,
        dueDate: editingProject.dueDate,
      } : {}),
    },
  });
  const title = type === "project" ? editingProject ? "Edit project" : "Create a project" : type === "task" ? "Create a task" : "Report a bug";
  const nameLabel = type === "project" ? "Project name" : type === "task" ? "Task title" : "Bug title";
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="create-modal" onSubmit={handleSubmit(onSubmit)}><div className="modal-heading"><div><span className="eyebrow">WORKSPACE</span><h2>{title}</h2></div><button type="button" className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button></div><label className="form-field"><span>{nameLabel}<i>*</i></span><input {...register("title")} aria-invalid={Boolean(errors.title)} maxLength={100} placeholder={type === "project" ? "e.g. Mobile app redesign" : type === "task" ? "What needs to get done?" : "What went wrong?"} autoFocus />{errors.title && <small className="field-error">{errors.title.message}</small>}</label>
    {type === "project" && <><label className="form-field"><span>Description</span><textarea {...register("description")} rows={3} maxLength={500} placeholder="What are you building?" />{errors.description && <small className="field-error">{errors.description.message}</small>}</label><div className="form-row"><label className="form-field"><span>Target date</span><input type="date" {...register("dueDate")} /></label><label className="form-field"><span>Project color</span><input type="color" {...register("color")} />{errors.color && <small className="field-error">{errors.color.message}</small>}</label></div><label className="form-field"><span>Status</span><select {...register("projectStatus")}>{["Planning", "In progress", "On hold", "Completed"].map((status) => <option key={status}>{status}</option>)}</select></label></>}
    {type !== "project" && <><label className="form-field"><span>Description</span><textarea {...register("description")} rows={3} maxLength={500} placeholder={type === "task" ? "Add context or acceptance criteria…" : "Steps to reproduce and expected behavior…"} />{errors.description && <small className="field-error">{errors.description.message}</small>}</label><label className="form-field"><span>Project</span><select {...register("projectId")}>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label><div className="form-row"><label className="form-field"><span>{type === "bug" ? "Severity" : "Priority"}</span>{type === "bug" ? <select {...register("severity")}>{["Critical", "High", "Medium", "Low"].map((severity) => <option key={severity}>{severity}</option>)}</select> : <select {...register("priority")}>{["Urgent", "High", "Medium", "Low"].map((priority) => <option key={priority}>{priority}</option>)}</select>}</label>{type === "task" && <label className="form-field"><span>Status</span><select {...register("status")}>{columns.map((status) => <option key={status}>{status}</option>)}</select></label>}{type === "task" && <label className="form-field"><span>Due date</span><input type="date" {...register("dueDate")} /></label>}</div>{type === "task" && <label className="form-field"><span>Labels <small>(comma separated)</small></span><input {...register("labels")} placeholder="Design, Frontend" />{errors.labels && <small className="field-error">{errors.labels.message}</small>}</label>}{projects.length === 0 && <p className="integration-error">Create a project first to add tasks and bugs.</p>}</>}
    <div className="modal-footer"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" className="modal-submit" disabled={type !== "project" && projects.length === 0}>{type === "project" && editingProject ? <Check size={15} /> : <Plus size={15} />}{type === "project" ? editingProject ? "Save changes" : "Create project" : type === "task" ? "Create task" : "Report bug"}</Button></div></form></div>;
}
