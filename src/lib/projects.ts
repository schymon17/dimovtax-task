import { z } from "zod";

export const projectStatuses = ["active", "on hold", "completed"] as const;
export const projectSortFields = ["name", "status", "deadline", "budget"] as const;
export const sortDirections = ["asc", "desc"] as const;

export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectSortField = (typeof projectSortFields)[number];
export type SortDirection = (typeof sortDirections)[number];

export type Project = {
  id: number;
  name: string;
  status: ProjectStatus;
  deadline: string;
  assignedTeamMember: string;
  budget: number;
  createdAt: string;
  updatedAt: string;
};

export const projectPayloadSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters."),
  status: z.enum(projectStatuses),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date."),
  assignedTeamMember: z
    .string()
    .trim()
    .min(2, "Assigned team member must be at least 2 characters."),
  budget: z.coerce.number().min(0, "Budget must be zero or greater."),
});

export type ProjectPayload = z.infer<typeof projectPayloadSchema>;

export function normalizeProject(row: {
  id: number;
  name: string;
  status: ProjectStatus;
  deadline: Date | string;
  assigned_team_member: string;
  budget: string | number;
  created_at: Date | string;
  updated_at: Date | string;
}): Project {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    deadline: formatDateOnly(row.deadline),
    assignedTeamMember: row.assigned_team_member,
    budget: Number(row.budget),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function formatDateOnly(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}
