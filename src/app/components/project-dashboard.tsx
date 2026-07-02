"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Edit3,
  LogOut,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  projectStatuses,
  type Project,
  type ProjectPayload,
  type ProjectSortField,
  type ProjectStatus,
  type SortDirection,
} from "@/lib/projects";

type Toast = {
  message: string;
  tone: "success" | "error";
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type DeleteTarget = {
  id: number;
  name: string;
} | null;

const emptyForm: ProjectPayload = {
  name: "",
  status: "active",
  deadline: new Date().toISOString().slice(0, 10),
  assignedTeamMember: "",
  budget: 0,
};

const pageSizeOptions = [5, 10, 20];

export function ProjectDashboard({ userName }: { userName: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortBy, setSortBy] = useState<ProjectSortField>("deadline");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 5,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortDirection,
    });

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return params.toString();
  }, [page, pageSize, search, sortBy, sortDirection, statusFilter]);

  const showToast = useCallback((nextToast: Toast) => {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects?${queryString}`);
      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load projects.");
      }

      setProjects(data.projects);
      setPagination(data.pagination);
    } catch (caughtError) {
      showToast({
        message: caughtError instanceof Error ? caughtError.message : "Could not load projects.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [queryString, showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProjects();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadProjects]);

  const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
  const activeCount = projects.filter((project) => project.status === "active").length;
  const soonestDeadline =
    projects.find(
      (project) =>
        project.status !== "completed" &&
        project.deadline >= new Date().toISOString().slice(0, 10),
    )?.deadline ?? "No upcoming deadlines";

  function openCreateModal() {
    setModalProject(null);
    setIsModalOpen(true);
  }

  function openEditModal(project: Project) {
    setModalProject(project);
    setIsModalOpen(true);
  }

  function changeSort(field: ProjectSortField) {
    setPage(1);

    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortBy(field);
    setSortDirection(field === "deadline" || field === "name" ? "asc" : "desc");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  async function deleteSelectedProject() {
    if (!deleteTarget) {
      return;
    }

    const response = await fetch(`/api/projects/${deleteTarget.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      showToast({ message: data.error ?? "Could not delete project.", tone: "error" });
      return;
    }

    setDeleteTarget(null);
    showToast({ message: `${deleteTarget.name} deleted.`, tone: "success" });
    await loadProjects();
  }

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Mini SaaS Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">
              Project operations
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Track client project status, deadlines, assigned owners, and budget at a glance.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="text-sm font-medium text-slate-500">Signed in as {userName}</span>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              onClick={logout}
              type="button"
            >
              <LogOut aria-hidden="true" size={18} />
              Sign out
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
              onClick={openCreateModal}
              type="button"
            >
              <Plus aria-hidden="true" size={18} />
              New project
            </button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <Metric
            icon={<Check aria-hidden="true" size={18} />}
            label="Active on this page"
            value={activeCount.toString()}
          />
          <Metric
            icon={<CalendarDays aria-hidden="true" size={18} />}
            label="Next deadline"
            value={formatDisplayDate(soonestDeadline)}
          />
          <Metric
            icon={<CircleDollarSign aria-hidden="true" size={18} />}
            label="Page budget"
            value={formatCurrency(totalBudget)}
          />
        </section>

        <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <label className="relative flex min-w-0 flex-1 items-center">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 text-slate-400"
              size={18}
            />
            <input
              className="h-11 w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by project or team member"
              type="search"
              value={search}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {["all", ...projectStatuses].map((status) => (
              <button
                className={`h-10 rounded-md border px-3 text-sm font-medium capitalize transition ${
                  statusFilter === status
                    ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
                key={status}
                onClick={() => {
                  setStatusFilter(status as ProjectStatus | "all");
                  setPage(1);
                }}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            Per page
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-2 text-slate-950"
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              value={pageSize}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </section>

        <ProjectList
          isLoading={isLoading}
          onDelete={(project) => setDeleteTarget(project)}
          onEdit={openEditModal}
          onSort={changeSort}
          projects={projects}
          sortBy={sortBy}
          sortDirection={sortDirection}
        />

        <PaginationControls
          pagination={pagination}
          setPage={setPage}
        />
      </section>

      <ToastMessage toast={toast} />

      {isModalOpen ? (
        <ProjectModal
          onClose={() => setIsModalOpen(false)}
          onSaved={async (projectName) => {
            setIsModalOpen(false);
            showToast({ message: `${projectName} saved.`, tone: "success" });
            await loadProjects();
          }}
          project={modalProject}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDeleteDialog
          onCancel={() => setDeleteTarget(null)}
          onConfirm={deleteSelectedProject}
          projectName={deleteTarget.name}
        />
      ) : null}
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <span className="grid size-8 place-items-center rounded-md bg-amber-100 text-amber-800">
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-3 truncate text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ProjectList({
  isLoading,
  onDelete,
  onEdit,
  onSort,
  projects,
  sortBy,
  sortDirection,
}: {
  isLoading: boolean;
  onDelete: (project: Project) => void;
  onEdit: (project: Project) => void;
  onSort: (field: ProjectSortField) => void;
  projects: Project[];
  sortBy: ProjectSortField;
  sortDirection: SortDirection;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Loading projects...
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No projects match the current filters.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <SortableHeader field="name" onSort={onSort} sortBy={sortBy} sortDirection={sortDirection}>
                Project
              </SortableHeader>
              <SortableHeader field="status" onSort={onSort} sortBy={sortBy} sortDirection={sortDirection}>
                Status
              </SortableHeader>
              <SortableHeader field="deadline" onSort={onSort} sortBy={sortBy} sortDirection={sortDirection}>
                Deadline
              </SortableHeader>
              <th className="px-5 py-4 font-semibold">Team member</th>
              <SortableHeader
                align="right"
                field="budget"
                onSort={onSort}
                sortBy={sortBy}
                sortDirection={sortDirection}
              >
                Budget
              </SortableHeader>
              <th className="px-5 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr className="transition hover:bg-slate-50" key={project.id}>
                <td className="px-5 py-4 font-medium text-slate-950">{project.name}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={project.status} />
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {formatDisplayDate(project.deadline)}
                </td>
                <td className="px-5 py-4 text-slate-600">{project.assignedTeamMember}</td>
                <td className="px-5 py-4 text-right font-medium text-slate-950">
                  {formatCurrency(project.budget)}
                </td>
                <td className="px-5 py-4">
                  <RowActions onDelete={() => onDelete(project)} onEdit={() => onEdit(project)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {projects.map((project) => (
          <article className="rounded-md border border-slate-200 p-4" key={project.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">{project.name}</h2>
                <div className="mt-2">
                  <StatusBadge status={project.status} />
                </div>
              </div>
              <RowActions onDelete={() => onDelete(project)} onEdit={() => onEdit(project)} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <ProjectFact
                icon={<CalendarDays size={16} />}
                label="Deadline"
                value={formatDisplayDate(project.deadline)}
              />
              <ProjectFact
                icon={<UserRound size={16} />}
                label="Owner"
                value={project.assignedTeamMember}
              />
              <ProjectFact
                icon={<CircleDollarSign size={16} />}
                label="Budget"
                value={formatCurrency(project.budget)}
              />
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function SortableHeader({
  align = "left",
  children,
  field,
  onSort,
  sortBy,
  sortDirection,
}: {
  align?: "left" | "right";
  children: React.ReactNode;
  field: ProjectSortField;
  onSort: (field: ProjectSortField) => void;
  sortBy: ProjectSortField;
  sortDirection: SortDirection;
}) {
  const isActive = sortBy === field;
  const Icon = sortDirection === "asc" ? ChevronUp : ChevronDown;

  return (
    <th className={`px-5 py-4 font-semibold ${align === "right" ? "text-right" : ""}`}>
      <button
        className={`inline-flex items-center gap-1 rounded-sm transition hover:text-emerald-700 ${
          align === "right" ? "justify-end" : ""
        }`}
        onClick={() => onSort(field)}
        type="button"
      >
        {children}
        {isActive ? <Icon aria-hidden="true" size={14} /> : null}
      </button>
    </th>
  );
}

function ProjectFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    "on hold": "bg-amber-50 text-amber-800 ring-amber-200",
    completed: "bg-sky-50 text-sky-800 ring-sky-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function RowActions({
  onDelete,
  onEdit,
}: {
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        aria-label="Edit project"
        className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800"
        onClick={onEdit}
        type="button"
      >
        <Edit3 aria-hidden="true" size={16} />
      </button>
      <button
        aria-label="Delete project"
        className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:border-red-300 hover:text-red-700"
        onClick={onDelete}
        type="button"
      >
        <Trash2 aria-hidden="true" size={16} />
      </button>
    </div>
  );
}

function ProjectModal({
  onClose,
  onSaved,
  project,
}: {
  onClose: () => void;
  onSaved: (projectName: string) => void;
  project: Project | null;
}) {
  const [form, setForm] = useState<ProjectPayload>(
    project
      ? {
          name: project.name,
          status: project.status,
          deadline: project.deadline,
          assignedTeamMember: project.assignedTeamMember,
          budget: project.budget,
        }
      : emptyForm,
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(project ? `/api/projects/${project.id}` : "/api/projects", {
        body: JSON.stringify(form),
        headers: {
          "Content-Type": "application/json",
        },
        method: project ? "PATCH" : "POST",
      });
      const data = response.status === 204 ? null : await response.json();

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not save project.");
      }

      onSaved(data.project.name);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save project.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
    >
      <form
        className="w-full max-w-xl rounded-lg bg-white p-5 shadow-2xl"
        onSubmit={submitForm}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              {project ? "Edit project" : "New project"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Keep the dashboard data current for the team.
            </p>
          </div>
          <button
            aria-label="Close modal"
            className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-500 transition hover:text-slate-950"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="grid gap-4 py-5 sm:grid-cols-2">
          <Field label="Project name">
            <input
              className="form-input"
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              type="text"
              value={form.name}
            />
          </Field>
          <Field label="Status">
            <select
              className="form-input capitalize"
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as ProjectStatus })
              }
              value={form.status}
            >
              {projectStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Deadline">
            <input
              className="form-input"
              onChange={(event) => setForm({ ...form, deadline: event.target.value })}
              required
              type="date"
              value={form.deadline}
            />
          </Field>
          <Field label="Assigned team member">
            <input
              className="form-input"
              onChange={(event) =>
                setForm({ ...form, assignedTeamMember: event.target.value })
              }
              required
              type="text"
              value={form.assignedTeamMember}
            />
          </Field>
          <Field label="Budget">
            <input
              className="form-input"
              min="0"
              onChange={(event) => setForm({ ...form, budget: Number(event.target.value) })}
              required
              step="100"
              type="number"
              value={form.budget}
            />
          </Field>
        </div>

        {error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <button
            className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Saving..." : "Save project"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDeleteDialog({
  onCancel,
  onConfirm,
  projectName,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  projectName: string;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-950">Delete project</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This will permanently delete {projectName}.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-10 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
            onClick={onConfirm}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function PaginationControls({
  pagination,
  setPage,
}: {
  pagination: Pagination;
  setPage: (page: number) => void;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing page {pagination.page} of {pagination.totalPages} for {pagination.total} projects
      </p>
      <div className="flex gap-2">
        <button
          className="h-10 rounded-md border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pagination.page <= 1}
          onClick={() => setPage(pagination.page - 1)}
          type="button"
        >
          Previous
        </button>
        <button
          className="h-10 rounded-md border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => setPage(pagination.page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </section>
  );
}

function ToastMessage({ toast }: { toast: Toast | null }) {
  if (!toast) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-[60] max-w-sm rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
        toast.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
      role="status"
    >
      {toast.message}
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDisplayDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
