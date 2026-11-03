import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("devpilot_github_token")?.value;
  if (!token) return NextResponse.json({ error: "Connect a GitHub account first." }, { status: 401 });
  try {
    const repository = request.nextUrl.searchParams.get("repository");
    if (repository) {
      const [owner, repo] = repository.split("/");
      if (!owner || !repo || !/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
        return NextResponse.json({ error: "Repository must use the owner/name format." }, { status: 400 });
      }
      const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
      const api = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
      const [commitsResponse, branchesResponse, pullsResponse] = await Promise.all([
        fetch(`${api}/commits?per_page=5`, { headers, signal: AbortSignal.timeout(15_000) }),
        fetch(`${api}/branches?per_page=30`, { headers, signal: AbortSignal.timeout(15_000) }),
        fetch(`${api}/pulls?state=open&per_page=5`, { headers, signal: AbortSignal.timeout(15_000) }),
      ]);
      if (!commitsResponse.ok || !branchesResponse.ok || !pullsResponse.ok) {
        const failed = [commitsResponse, branchesResponse, pullsResponse].find((response) => !response.ok);
        console.error("GitHub repository activity request failed:", failed?.status, await failed?.text());
        return NextResponse.json({ error: "GitHub could not return repository activity. Check repository access and try again." }, { status: failed?.status === 401 ? 401 : 502 });
      }
      const [commits, branches, pullRequests] = await Promise.all([
        commitsResponse.json(),
        branchesResponse.json(),
        pullsResponse.json(),
      ]);
      return NextResponse.json({
        commits: commits.map((commit: { sha: string; commit: { message: string; author: { name: string; date: string } | null }; html_url: string }) => ({
          sha: commit.sha.slice(0, 7),
          message: commit.commit.message.split("\n")[0],
          author: commit.commit.author?.name ?? "Unknown",
          date: commit.commit.author?.date ?? "",
          url: commit.html_url,
        })),
        branches: branches.map((branch: { name: string; protected: boolean }) => ({ name: branch.name, protected: branch.protected })),
        pullRequests: pullRequests.map((pull: { number: number; title: string; html_url: string; user: { login: string } }) => ({
          number: pull.number,
          title: pull.title,
          url: pull.html_url,
          author: pull.user.login,
        })),
      });
    }
    const url = new URL("https://api.github.com/user/repos");
    url.searchParams.set("sort", "updated");
    url.searchParams.set("per_page", "30");
    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.error("GitHub repositories request failed:", response.status, await response.text());
      return NextResponse.json({ error: "GitHub could not return repositories. Reconnect your account and try again." }, { status: response.status === 401 ? 401 : 502 });
    }
    const repositories = await response.json();
    return NextResponse.json({ repositories: repositories.map((repo: { id: number; full_name: string; description: string | null; language: string | null; html_url: string; updated_at: string; default_branch: string }) => ({
      id: repo.id,
      name: repo.full_name,
      description: repo.description,
      language: repo.language,
      url: repo.html_url,
      updatedAt: repo.updated_at,
      defaultBranch: repo.default_branch,
    })) });
  } catch (error) {
    console.error("GitHub repositories request failed:", error);
    return NextResponse.json({ error: "Could not reach GitHub. Please try again." }, { status: 502 });
  }
}
