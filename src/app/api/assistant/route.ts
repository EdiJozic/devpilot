import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(2000),
  projects: z.array(z.object({ id: z.string(), name: z.string(), status: z.string(), description: z.string().max(600).optional() })).max(50).default([]),
  tasks: z.array(z.object({ id: z.string(), title: z.string(), description: z.string().max(500).optional(), status: z.string(), priority: z.string(), projectId: z.string() })).max(200).default([]),
  issues: z.array(z.object({ id: z.string(), title: z.string(), description: z.string().max(500).optional(), status: z.string(), severity: z.string() })).max(100).default([]),
});

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.OPENAI_API_KEY) });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a prompt under 2,000 characters and valid workspace context." }, { status: 400 });
  }
  const { prompt, projects, tasks, issues } = parsed.data;
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(process.env.OPENAI_API_URL ?? "https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          temperature: 0.4,
          messages: [
            { role: "system", content: "You are DevPilot, a practical, concise software development assistant. Use only the workspace context supplied. Do not invent project facts. Give clear next actions." },
            { role: "user", content: `Workspace context:\n${JSON.stringify({ projects, tasks, issues })}\n\nRequest: ${prompt}` },
          ],
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) {
        const detail = await response.text();
        console.error("AI provider returned an error:", response.status, detail.slice(0, 500));
        return NextResponse.json({ error: "The AI provider could not complete this request. Check the server logs and provider configuration." }, { status: 502 });
      }
      const result = await response.json();
      const reply = result.choices?.[0]?.message?.content;
      if (typeof reply !== "string" || !reply.trim()) {
        return NextResponse.json({ error: "The AI provider returned an empty response." }, { status: 502 });
      }
      return NextResponse.json({ reply, mode: "live" });
    } catch (error) {
      console.error("AI provider request failed:", error);
      return NextResponse.json({ error: "Could not reach the AI provider. Please try again." }, { status: 502 });
    }
  }

  const openTasks = tasks.filter((task) => task.status !== "Done");
  const highPriority = openTasks.filter((task) => task.priority === "Urgent" || task.priority === "High");
  const unresolvedIssues = issues.filter((issue) => issue.status !== "Resolved");
  const projectSummary = projects.length
    ? projects.map((project) => `${project.name} (${project.status})`).join(", ")
    : "No projects yet";
  const reply = /bug|debug|tooltip|error|issue/i.test(prompt)
    ? `For the reported issue, start by reproducing it at the smallest affected viewport and capture the browser console and network activity. Check the component's container bounds, overflow/positioning rules, and responsive breakpoints; then add a regression test for the failing size. There are ${unresolvedIssues.length} unresolved issue(s) in your workspace, so link the fix to the relevant bug before closing it.`
    : /roadmap|plan|week/i.test(prompt)
      ? `A practical next step is to focus the roadmap around your current projects: ${projectSummary}. First clear the ${highPriority.length} high-priority task(s), then reserve a short review pass for tasks already in review. Keep one small buffer for the ${unresolvedIssues.length} unresolved bug(s), and define a clear “done” outcome for each project milestone.`
      : /priorit|today|next/i.test(prompt)
        ? `Start with the ${highPriority.length} urgent or high-priority open task(s), especially work that blocks another person or has a near deadline. Your current focus includes ${openTasks.slice(0, 3).map((task) => task.title).join("; ") || "no open tasks"}. Then spend a short block on the ${unresolvedIssues.length} unresolved bug(s) before taking on lower-priority polish.`
        : `Here’s a snapshot of your workspace: ${projects.length} project(s), ${openTasks.length} active task(s), ${tasks.filter((task) => task.status === "Done").length} completed task(s), and ${unresolvedIssues.length} unresolved bug(s). Your projects are ${projectSummary}. A useful next move is to review the high-priority tasks and make sure every in-progress item has a clear next action.`;
  return NextResponse.json({ reply, mode: "demo" });
}
