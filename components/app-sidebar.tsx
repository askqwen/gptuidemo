"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarGroupLabel,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar"
import { OpenAIIcon, XIcon } from "@/components/icons"
import { ChatManager, type Chat } from "@/lib/chat-manager"

export function AppSidebar() {
  const { open } = useSidebar()
  const router = useRouter()
  const [chats, setChats] = React.useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = React.useState<string | null>(null)

  // Load chats on mount
  React.useEffect(() => {
    const loadedChats = ChatManager.getAllChats()
    const currentId = ChatManager.getCurrentChatId()
    setChats(loadedChats)
    setCurrentChatId(currentId)
  }, [])

  // Listen for storage changes to sync across tabs
  React.useEffect(() => {
    const handleStorageChange = () => {
      const loadedChats = ChatManager.getAllChats()
      const currentId = ChatManager.getCurrentChatId()
      setChats(loadedChats)
      setCurrentChatId(currentId)
    }

    window.addEventListener("storage", handleStorageChange)

    // Custom event for same-tab updates
    window.addEventListener("chats-updated", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("chats-updated", handleStorageChange)
    }
  }, [])

  const handleNewChat = () => {
    // Clear current chat
    ChatManager.setCurrentChatId(null)
    setCurrentChatId(null)

    // Navigate to home page
    router.push("/")

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("new-chat"))
  }

  const handleChatClick = (chat: Chat) => {
    ChatManager.setCurrentChatId(chat.id)
    setCurrentChatId(chat.id)

    // Navigate to chat page with the selected chat
    router.push("/chat")

    // Dispatch custom event with chat data
    window.dispatchEvent(new CustomEvent("load-chat", { detail: chat }))
  }

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()

    ChatManager.deleteChat(chatId)

    // If we're deleting the current chat, clear it
    if (currentChatId === chatId) {
      ChatManager.setCurrentChatId(null)
      setCurrentChatId(null)
      router.push("/")
    }

    // Update local state
    setChats((prev) => prev.filter((c) => c.id !== chatId))

    // Notify other components
    window.dispatchEvent(new CustomEvent("chats-updated"))
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return "Dzisiaj"
    } else if (diffInHours < 48) {
      return "Wczoraj"
    } else if (diffInHours < 168) {
      // 7 days
      return `${Math.floor(diffInHours / 24)} dni temu`
    } else {
      return date.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
      })
    }
  }

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <OpenAIIcon className="w-6 h-6 text-black dark:text-white" />
            </div>
          </div>
          {/* SidebarTrigger w prawym górnym rogu sidebara gdy jest otwarty */}
          {open && <SidebarTrigger className="rounded-full hover:bg-gray-100 dark:hover:bg-[#515151]" />}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleNewChat}
                  className="rounded-[20px] h-12 hover:bg-gray-100 dark:hover:bg-[#515151]"
                >
                  <img src="/edit-icon.svg" alt="New chat" className="h-4 w-4" />
                  <span>Nowy czat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 dark:text-gray-400 px-2 py-1">Historia rozmów</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.length === 0 ? (
                <SidebarMenuItem>
                  <div className="px-2 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                    Brak zapisanych rozmów
                  </div>
                </SidebarMenuItem>
              ) : (
                chats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      onClick={() => handleChatClick(chat)}
                      className={`rounded-[20px] h-auto min-h-10 hover:bg-gray-100 dark:hover:bg-[#515151] text-sm group relative ${
                        currentChatId === chat.id ? "bg-gray-100 dark:bg-[#515151]" : ""
                      }`}
                    >
                      <div className="flex flex-col items-start flex-1 min-w-0 py-1">
                        <span className="truncate w-full text-left font-medium">{chat.title}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(chat.updatedAt)}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity ml-2"
                        aria-label="Usuń rozmowę"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
