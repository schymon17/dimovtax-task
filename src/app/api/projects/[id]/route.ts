import { NextResponse } from "next/server";

import { getSessionFromCookieHeader } from "@/lib/auth";
import { deleteProject, getProject, updateProject } from "@/lib/project-repository";
import { projectPayloadSchema } from "@/lib/projects";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: RouteContext<"/api/projects/[id]">,
) {
  if (!getSessionFromCookieHeader(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const id = Number((await context.params).id);

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  const project = await getProject(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/projects/[id]">,
) {
  if (!getSessionFromCookieHeader(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const id = Number((await context.params).id);

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  const parsed = projectPayloadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const project = await updateProject(id, parsed.data);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/projects/[id]">,
) {
  if (!getSessionFromCookieHeader(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const id = Number((await context.params).id);

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  const deleted = await deleteProject(id);

  if (!deleted) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
