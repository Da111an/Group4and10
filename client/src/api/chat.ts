export interface ChatMessageRequest {
  message: string
  history?: ChatHistoryItem[]
}

export interface ChatMessageResponse {
  reply: string
}

export interface ChatHistoryItem {
  role: "user" | "assistant"
  text: string
}

export async function sendChatMessage(message: string, history: ChatHistoryItem[] = []): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history: history.slice(-8),
    } satisfies ChatMessageRequest),
  })

  let data: ChatMessageResponse | null = null
  try {
    data = (await response.json()) as ChatMessageResponse
  } catch {
    data = null
  }

  if (!response.ok) {
    const fallback = "I couldn't send that right now. Please try again."
    throw new Error(data?.reply || fallback)
  }

  return data?.reply || "I couldn't generate a reply right now."
}
