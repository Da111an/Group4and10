# Group 4 & 10

Full-stack application: **React** (Vite + TypeScript) | **.NET 10 Web API**

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

## Getting Started

```bash
cd client
npm install
npm run build
cd ../server
dotnet run
```

Open `http://localhost:5027` for the app (frontend + API on one host).

## Chatbot Setup

The support chat widget lives in `client/src/components/chat-widget.tsx` and sends requests to `POST /api/chat`.

Set the backend environment variables before running `dotnet run` in the same PowerShell window:

```powershell
cd server
$env:GEMINI_API_KEY="your_gemini_api_key_here"
$env:GEMINI_MODEL="gemini-2.5-flash"
dotnet run
```

If you close that terminal or start the server in a different one, PowerShell will not keep those `$env:` values. You can also persist them for local development with:

```powershell
cd server
dotnet user-secrets init
dotnet user-secrets set "Gemini:ApiKey" "your_gemini_api_key_here"
dotnet user-secrets set "Gemini:Model" "gemini-2.5-flash"
dotnet run
```

The API route is implemented in `server/Controllers/ChatController.cs`, and the frontend request helper is in `client/src/api/chat.ts`.

## Project Structure

```
├── client/          # React + TypeScript (Vite)
├── server/          # .NET Web API
└── README.md
```


User Requirements (EARS)

COMPLETE:
1. Ubiquitous
The System shall allow users to browse all mental health resources
anonymously without requiring an account, email, phone number, cookies, or
institutional login.
2. State-driven
While the user is browsing any page of the system, the System shall display a
persistent "SOS" button that is always visible and accessible.
3. Event-driven
When the user activates the "Get Immediate Help" button, the System shall
immediately surface crisis options (e.g., 988, SafeUT, and user-selected trusted
contacts) without navigating away from the current page.
4. State-driven
While the user is exploring resources, the System shall present information in a
non-judgmental, non-clinical tone that avoids directive language such as "you
must" or "you should."

INCOMPLETE:
1. Ubiquitous
The System shall be accessible on both mobile and desktop devices and load all
primary content in under 2 seconds on standard mobile data connections.
2. Event-driven
When the user selects a filter (e.g., "Open Now," "Free," or "Students Only"), the
System shall dynamically update the resource list to display only matching and
currently available resources.
3. Event-driven
When the user selects "Student" as their status, the System shall prioritize
student-specific resources (such as CAPS and university-affiliated clinics) in
search results without excluding non-student options.
4. Event-driven
When the user clicks the "Quick Exit" button, the System shall immediately
redirect the browser to a neutral external webpage and clear the current session
state.
5. Event-driven
When the user chooses to contact a trusted person instead of a professional, the
System shall provide optional message templates to reduce the emotional
burden of reaching out.
