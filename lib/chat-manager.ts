export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export interface Chat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  model: string
}

export class ChatManager {
  private static STORAGE_KEY = "gpt-ui-chats"
  private static CURRENT_CHAT_KEY = "gpt-ui-current-chat"

  static getAllChats(): Chat[] {
    if (typeof window === "undefined") return []

    try {
      const chats = localStorage.getItem(this.STORAGE_KEY)
      return chats ? JSON.parse(chats) : []
    } catch {
      return []
    }
  }

  static saveChat(chat: Chat): void {
    if (typeof window === "undefined") return

    const chats = this.getAllChats()
    const existingIndex = chats.findIndex((c) => c.id === chat.id)

    if (existingIndex >= 0) {
      chats[existingIndex] = { ...chat, updatedAt: Date.now() }
    } else {
      chats.unshift(chat)
    }

    // Keep only last 50 chats
    const limitedChats = chats.slice(0, 50)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedChats))
  }

  static deleteChat(chatId: string): void {
    if (typeof window === "undefined") return

    const chats = this.getAllChats()
    const filteredChats = chats.filter((c) => c.id !== chatId)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredChats))
  }

  static getCurrentChatId(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(this.CURRENT_CHAT_KEY)
  }

  static setCurrentChatId(chatId: string | null): void {
    if (typeof window === "undefined") return

    if (chatId) {
      localStorage.setItem(this.CURRENT_CHAT_KEY, chatId)
    } else {
      localStorage.removeItem(this.CURRENT_CHAT_KEY)
    }
  }

  static generateChatTitle(firstMessage: string): string {
    // Generate title from first message (max 50 chars)
    const title = firstMessage.trim().slice(0, 50)
    return title.length < firstMessage.trim().length ? title + "..." : title
  }

  static generateChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
