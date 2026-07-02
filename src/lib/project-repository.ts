import { pool } from "./db";
import {
  normalizeProject,
  type Project,
  type ProjectPayload,
  type ProjectSortField,
  type ProjectStatus,
  type SortDirection,
} from "./projects";

const sortColumns: Record<ProjectSortField, string> = {
  budget: "budget",
  deadline: "deadline",
  name: "name",
  status: "status",
};

export async function listProjects(filters: {
  page: number;
  pageSize: number;
  sortBy: ProjectSortField;
  sortDirection: SortDirection;
  status?: ProjectStatus;
  search?: string;
}): Promise<{
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  projects: Project[];
}> {
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.status) {
    values.push(filters.status);
    where.push(`status = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    where.push(
      `(name ILIKE $${values.length} OR assigned_team_member ILIKE $${values.length})`,
    );
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countResult = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM projects
      ${whereSql}
    `,
    values,
  );
  const total = Number(countResult.rows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const offset = (page - 1) * filters.pageSize;
  const sortColumn = sortColumns[filters.sortBy];
  const sortDirection = filters.sortDirection === "desc" ? "DESC" : "ASC";
  const listValues = [...values, filters.pageSize, offset];

  const result = await pool.query(
    `
      SELECT id, name, status, deadline::text AS deadline, assigned_team_member, budget, created_at, updated_at
      FROM projects
      ${whereSql}
      ORDER BY ${sortColumn} ${sortDirection}, id ASC
      LIMIT $${listValues.length - 1}
      OFFSET $${listValues.length}
    `,
    listValues,
  );

  return {
    pagination: {
      page,
      pageSize: filters.pageSize,
      total,
      totalPages,
    },
    projects: result.rows.map(normalizeProject),
  };
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const result = await pool.query(
    `
      INSERT INTO projects (name, status, deadline, assigned_team_member, budget)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, status, deadline::text AS deadline, assigned_team_member, budget, created_at, updated_at
    `,
    [
      payload.name,
      payload.status,
      payload.deadline,
      payload.assignedTeamMember,
      payload.budget,
    ],
  );

  return normalizeProject(result.rows[0]);
}

export async function getProject(id: number): Promise<Project | null> {
  const result = await pool.query(
    `
      SELECT id, name, status, deadline::text AS deadline, assigned_team_member, budget, created_at, updated_at
      FROM projects
      WHERE id = $1
    `,
    [id],
  );

  return result.rowCount ? normalizeProject(result.rows[0]) : null;
}

export async function updateProject(
  id: number,
  payload: ProjectPayload,
): Promise<Project | null> {
  const result = await pool.query(
    `
      UPDATE projects
      SET name = $1,
          status = $2,
          deadline = $3,
          assigned_team_member = $4,
          budget = $5,
          updated_at = NOW()
      WHERE id = $6
      RETURNING id, name, status, deadline::text AS deadline, assigned_team_member, budget, created_at, updated_at
    `,
    [
      payload.name,
      payload.status,
      payload.deadline,
      payload.assignedTeamMember,
      payload.budget,
      id,
    ],
  );

  return result.rowCount ? normalizeProject(result.rows[0]) : null;
}

export async function deleteProject(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM projects WHERE id = $1", [id]);

  return Boolean(result.rowCount);
}
