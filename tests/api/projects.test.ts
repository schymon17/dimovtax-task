import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSessionToken, sessionCookieName } from "@/lib/auth";
import { type Project } from "@/lib/projects";

const listProjects = vi.fn();
const createProject = vi.fn();

vi.mock("@/lib/project-repository", () => ({
  createProject,
  listProjects,
}));

const sessionCookie = `${sessionCookieName}=${createSessionToken()}`;

describe("projects API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication for project lists", async () => {
    const { GET } = await import("@/app/api/projects/route");

    const response = await GET(new Request("http://localhost/api/projects"));

    expect(response.status).toBe(401);
    expect(listProjects).not.toHaveBeenCalled();
  });

  it("passes pagination, sorting, and filters to the repository", async () => {
    const project = buildProject();

    listProjects.mockResolvedValueOnce({
      pagination: {
        page: 2,
        pageSize: 5,
        total: 11,
        totalPages: 3,
      },
      projects: [project],
    });

    const { GET } = await import("@/app/api/projects/route");
    const response = await GET(
      new Request(
        "http://localhost/api/projects?page=2&pageSize=5&sortBy=budget&sortDirection=desc&status=active&search=tax",
        {
          headers: {
            cookie: sessionCookie,
          },
        },
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listProjects).toHaveBeenCalledWith({
      page: 2,
      pageSize: 5,
      search: "tax",
      sortBy: "budget",
      sortDirection: "desc",
      status: "active",
    });
    expect(body.projects).toEqual([project]);
    expect(body.pagination.totalPages).toBe(3);
  });

  it("validates project payloads before create", async () => {
    const { POST } = await import("@/app/api/projects/route");
    const response = await POST(
      new Request("http://localhost/api/projects", {
        body: JSON.stringify({
          budget: -1,
          deadline: "tomorrow",
          name: "A",
          status: "active",
          assignedTeamMember: "",
        }),
        headers: {
          "Content-Type": "application/json",
          cookie: sessionCookie,
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(createProject).not.toHaveBeenCalled();
  });
});

function buildProject(): Project {
  return {
    assignedTeamMember: "Maya Chen",
    budget: 42000,
    createdAt: "2026-07-02T12:00:00.000Z",
    deadline: "2026-07-18",
    id: 1,
    name: "Tax Advisory Portal",
    status: "active",
    updatedAt: "2026-07-02T12:00:00.000Z",
  };
}
