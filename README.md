# DimovTax Mini SaaS Dashboard

A full-stack project dashboard built for the interview task with Next.js, PostgreSQL, Tailwind CSS, and Docker.

## Features

- List projects in a responsive table/card layout
- Search by project name or assigned team member
- Filter by status: `active`, `on hold`, or `completed`
- Sort by project, status, deadline, or budget
- Paginate project results and choose page size
- Add, edit, view, and delete projects through REST endpoints
- Demo authentication with an HTTP-only session cookie
- Toast notifications for create/update/delete feedback
- PostgreSQL seed data on first database startup
- Production Docker setup with `docker compose`
- Automated API route tests and one Playwright UI workflow

## Tech Stack

- Next.js App Router
- React
- Tailwind CSS
- Next.js Route Handlers
- PostgreSQL
- Docker and Docker Compose

## Quick Start With Docker

```bash
docker compose up --build
```

Open [http://localhost:3200](http://localhost:3200).

Demo login:

```text
Email: admin@dimovtax.local
Password: demo-password
```

The Postgres service is exposed on host port `5433` and uses:

```text
DATABASE_URL=postgres://postgres:postgres@localhost:5433/dimovtax
```

Seed data is loaded from [db/init/001_create_projects.sql](/Users/szymonszymczyna/Documents/Projects/dimovtax-task/db/init/001_create_projects.sql) the first time the Docker volume is created.

## Local Development

Start Postgres only:

```bash
docker compose up postgres
```

Install dependencies and run Next.js:

```bash
npm install
npm run dev
```

Open the URL printed by Next.js, usually [http://localhost:3000](http://localhost:3000).

## Authentication

The demo account can be configured with environment variables:

```text
DEMO_USERNAME=admin@dimovtax.local
DEMO_PASSWORD=demo-password
DEMO_USER_NAME=Demo User
SESSION_SECRET=change-this-for-shared-environments
```

Dashboard and project API routes require a valid session cookie.

## REST API

`GET /api/projects`

Optional query parameters:

- `status=active|on hold|completed`
- `search=<text>`
- `page=1`
- `pageSize=5`
- `sortBy=name|status|deadline|budget`
- `sortDirection=asc|desc`

`POST /api/projects`

```json
{
  "name": "Tax Advisory Portal",
  "status": "active",
  "deadline": "2026-07-18",
  "assignedTeamMember": "Maya Chen",
  "budget": 42000
}
```

`GET /api/projects/:id`

`PATCH /api/projects/:id`

`DELETE /api/projects/:id`

## Useful Commands

```bash
npm run lint
npm test
npm run test:e2e
npm run build
docker compose down
docker compose down -v
```

`npm run test:e2e` starts the Docker Compose app as its Playwright web server.
