# Group 4 & 10

Full-stack application: **React** (Vite + TypeScript) | **.NET 10 Web API** | **PostgreSQL**

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [Docker](https://www.docker.com/) (for PostgreSQL)

## Getting Started

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This launches Postgres on `localhost:5432` with database `group4and10`.

### 2. Run the API

```bash
cd server
dotnet run
```

The API starts at `http://localhost:5027`. OpenAPI docs are available at `/openapi/v1.json` in development.

### 3. Run the React frontend

```bash
cd client
npm install   # first time only
npm run dev
```

The frontend starts at `http://localhost:5173`. API calls to `/api/*` are automatically proxied to the backend.

## Project Structure

```
├── client/          # React + TypeScript (Vite)
├── server/          # .NET Web API + EF Core
├── docker-compose.yml
└── README.md
```

## Connection String

Default (configured in `server/appsettings.json`):

```
Host=localhost;Port=5432;Database=group4and10;Username=postgres;Password=postgres
```
