const API_BASE = import.meta.env.VITE_API_URL ?? ""

export interface ChatReply {
  reply: string
}

export async function sendChatMessage(message: string): Promise<ChatReply> {
  const base = API_BASE || ""
  const response = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ message }),
  })

  const data = (await response.json().catch(() => null)) as ChatReply | null

  if (!response.ok || !data?.reply) {
    throw new Error(data?.reply || `Chat request failed with status ${response.status}`)
  }

  return data
}
