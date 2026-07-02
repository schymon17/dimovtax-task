import { NextResponse } from "next/server";

import { getSessionFromCookieHeader } from "@/lib/auth";
import { createProject, listProjects } from "@/lib/project-repository";
import {
  projectPayloadSchema,
  projectSortFields,
  projectStatuses,
  sortDirections,
} from "@/lib/projects";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!getSessionFromCookieHeader(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const page = toPositiveInteger(searchParams.get("page"), 1);
  const pageSize = Math.min(toPositiveInteger(searchParams.get("pageSize"), 5), 50);
  const sortBy = searchParams.get("sortBy") ?? "deadline";
  const sortDirection = searchParams.get("sortDirection") ?? "asc";

  if (status && !projectStatuses.includes(status as never)) {
    return NextResponse.json({ error: "Invalid project status." }, { status: 400 });
  }

  if (!projectSortFields.includes(sortBy as never)) {
    return NextResponse.json({ error: "Invalid sort field." }, { status: 400 });
  }

  if (!sortDirections.includes(sortDirection as never)) {
    return NextResponse.json({ error: "Invalid sort direction." }, { status: 400 });
  }

  const result = await listProjects({
    page,
    pageSize,
    sortBy: sortBy as (typeof projectSortFields)[number],
    sortDirection: sortDirection as (typeof sortDirections)[number],
    status: status as (typeof projectStatuses)[number] | undefined,
    search,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!getSessionFromCookieHeader(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = projectPayloadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const project = await createProject(parsed.data);

  return NextResponse.json({ project }, { status: 201 });
}

function toPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}
