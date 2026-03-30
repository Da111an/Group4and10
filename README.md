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
You should see a floating `Chat` button in the bottom-right corner of the app.

### Recommended (persists locally with user-secrets)

```bash
cd server
dotnet user-secrets set "Gemini:ApiKey" "your_gemini_api_key_here"
dotnet user-secrets set "Gemini:Model" "gemini-2.5-flash"
dotnet run --launch-profile http
```

### One-terminal-session only (macOS/Linux zsh)

```bash
cd server
export GEMINI_API_KEY="your_gemini_api_key_here"
export GEMINI_MODEL="gemini-2.5-flash"
dotnet run --launch-profile http
```

### One-terminal-session only (PowerShell)

```powershell
cd server
$env:GEMINI_API_KEY="your_gemini_api_key_here"
$env:GEMINI_MODEL="gemini-2.5-flash"
dotnet run --launch-profile http
```

If the key is missing, the chat API returns a setup error message telling you `GEMINI_API_KEY` is not configured.
The API route is in `server/Controllers/ChatController.cs`, and the frontend helper is in `client/src/api/chat.ts`.
## Project Structure

```
├── client/          # React + TypeScript (Vite)
├── server/          # .NET Web API
└── README.md
```


## User Requirements (EARS)

### Complete

1. **Ubiquitous**  
   The system shall allow users to browse all mental health resources anonymously without requiring an account, email, phone number, cookies, or institutional login.

2. **State-driven**  
   While the user is browsing any page of the system, the system shall display a persistent "SOS" button that is always visible and accessible.

3. **Event-driven**  
   When the user activates the "Get Immediate Help" button, the system shall immediately surface crisis options (e.g., 988, SafeUT, and user-selected trusted contacts) without navigating away from the current page.

4. **State-driven**  
   While the user is exploring resources, the system shall present information in a non-judgmental, non-clinical tone that avoids directive language such as "you must" or "you should."

5. **Ubiquitous**  
   The system shall be accessible on both mobile and desktop devices and load all primary content in under 2 seconds on standard mobile data connections.

6. **Event-driven**  
   When the user selects a filter (e.g.,  "Free," ), the system shall dynamically update the resource list to display only matching and currently available resources.
### Incomplete





