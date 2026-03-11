# Group 4 & 10

Full-stack application: **React** (Vite + TypeScript) | **.NET 10 Web API**

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

## Getting Started

### 1. Run the API

```bash
cd server
dotnet run
```

The API starts at `http://localhost:5027`. OpenAPI docs are available at `/openapi/v1.json` in development.

### 2. Run the React frontend

```bash
cd client
npm install   # first time only
npm run dev
```

The frontend starts at `http://localhost:5173`. API calls to `/api/*` are automatically proxied to the backend.

## Project Structure

```
├── client/          # React + TypeScript (Vite)
├── server/          # .NET Web API
└── README.md
```
