"use client"

import * as React from "react"
import { Copy, RotateCcw, Share } from "@/components/icons"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { aiModels } from "@/lib/constants"
import { PromptBox } from "../prompt-box-demo"
import { SidebarInset, SidebarTrigger, useSidebar } from "./ui/sidebar"
import { ChatManager, type Chat, type ChatMessage } from "@/lib/chat-manager"

// Model Selector Component for Header
const HeaderModelSelector = () => {
  const [selectedModel, setSelectedModel] = React.useState(
    aiModels.find((m) => m.id === "deepseek-ai/deepseek-r1-0528") || aiModels[0],
  )
  const [isOpen, setIsOpen] = React.useState(false)
  const [, setCurrentModel] = React.useState(aiModels[0].id)

  const handleModelSelect = (model: (typeof aiModels)[0]) => {
    setSelectedModel(model)
    setCurrentModel(model.id)
    setIsOpen(false)
  }

  return (
    <div className="flex items-center justify-center flex-1">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button className="text-black dark:text-white font-medium">{selectedModel.name}</button>
        </PopoverTrigger>
        <PopoverContent align="center" side="bottom" className="p-2">
          <div className="space-y-1">
            <div className="px-3 py-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Wybierz model AI</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dostępne modele do konwersacji</p>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-600 mx-2"></div>
            {aiModels.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  handleModelSelect(model)
                }}
                className={`w-full text-left p-3 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  selectedModel.id === model.id ? "bg-gray-100 dark:bg-gray-700" : ""
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{model.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-lg">
                      {model.provider}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{model.description}</p>
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Reusable Message Components
const UserMessage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-end mb-4">
    <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-2xl max-w-xs md:max-w-md lg:max-w-lg">
      {children}
    </div>
  </div>
)

const AssistantMessage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-start mb-6">
    <div className="text-gray-900 dark:text-gray-100 px-0 py-0 max-w-xs md:max-w-md lg:max-w-2xl">{children}</div>
  </div>
)

const ActionButtons = () => (
  <div className="flex justify-start mb-6 ml-1">
    <div className="flex gap-2">
      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>
      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
        <RotateCcw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>
      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
        <Share className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  </div>
)

export default function ChatScreen() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [currentModel, setCurrentModel] = React.useState("deepseek-ai/deepseek-r1-0528")
  const [currentChatId, setCurrentChatId] = React.useState<string | null>(null)
  const promptBoxRef = React.useRef<HTMLTextAreaElement>(null)
  const { open } = useSidebar()

  // Save chat whenever messages change
  React.useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      const chat: Chat = {
        id: currentChatId,
        title: ChatManager.generateChatTitle(messages[0]?.content || "Nowa rozmowa"),
        messages: messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: currentModel,
      }

      ChatManager.saveChat(chat)
      window.dispatchEvent(new CustomEvent("chats-updated"))
    }
  }, [messages, currentChatId, currentModel])

  React.useEffect(() => {
    // Handle initial message from start screen
    const initialMessage = sessionStorage.getItem("initialMessage")
    const selectedModel = sessionStorage.getItem("selectedModel")

    if (initialMessage) {
      // Clear sessionStorage
      sessionStorage.removeItem("initialMessage")
      sessionStorage.removeItem("selectedModel")

      // Set model if provided
      if (selectedModel) {
        setCurrentModel(selectedModel)
      }

      // Create new chat
      const newChatId = ChatManager.generateChatId()
      setCurrentChatId(newChatId)
      ChatManager.setCurrentChatId(newChatId)

      // Add user message and send to API
      const userMessage: ChatMessage = {
        role: "user",
        content: initialMessage,
        timestamp: Date.now(),
      }

      setMessages([userMessage])
      setIsLoading(true)

      // Call API
      handleInitialMessage(initialMessage, selectedModel || currentModel)
    } else {
      // Check if we should load an existing chat
      const currentId = ChatManager.getCurrentChatId()
      if (currentId) {
        const chats = ChatManager.getAllChats()
        const existingChat = chats.find((c) => c.id === currentId)
        if (existingChat) {
          setCurrentChatId(currentId)
          setMessages(existingChat.messages)
          setCurrentModel(existingChat.model)
        }
      }
    }

    // Listen for new chat event
    const handleNewChat = () => {
      setMessages([])
      setCurrentChatId(null)
      setIsLoading(false)
    }

    // Listen for load chat event
    const handleLoadChat = (event: CustomEvent) => {
      const chat = event.detail as Chat
      setCurrentChatId(chat.id)
      setMessages(chat.messages)
      setCurrentModel(chat.model)
      setIsLoading(false)
    }

    window.addEventListener("new-chat", handleNewChat)
    window.addEventListener("load-chat", handleLoadChat as EventListener)

    return () => {
      window.removeEventListener("new-chat", handleNewChat)
      window.removeEventListener("load-chat", handleLoadChat as EventListener)
    }
  }, [])

  const handleInitialMessage = async (message: string, model: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: message }],
          model: model,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.details || data.error)
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `Przepraszam, wystąpił błąd podczas przetwarzania Twojej wiadomości: ${error instanceof Error ? error.message : "Nieznany błąd"}`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const message = formData.get("message") as string

    if (!message && !event.currentTarget.querySelector("img")) {
      return
    }

    // Create new chat if none exists
    let chatId = currentChatId
    if (!chatId) {
      chatId = ChatManager.generateChatId()
      setCurrentChatId(chatId)
      ChatManager.setCurrentChatId(chatId)
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Prepare messages for API
      const chatMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Add current message
      chatMessages.push({ role: "user", content: message })

      // Call API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: chatMessages,
          model: currentModel,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.details || data.error)
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `Przepraszam, wystąpił błąd podczas przetwarzania Twojej wiadomości: ${error instanceof Error ? error.message : "Nieznany błąd"}`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }

    // Reset form
    event.currentTarget.reset()
  }

  const clearPromptBox = () => {
    if (promptBoxRef.current) {
      promptBoxRef.current.value = ""
    }
  }

  return (
    <SidebarInset className="safe-area-top safe-area-bottom">
      {/* Header z warunkowo wyświetlanym SidebarTrigger i Model Selector - na samej górze */}
      <div className="absolute top-0 left-0 right-0 z-10 px-2 py-2 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center">
          {/* SidebarTrigger tylko gdy sidebar jest zamknięty */}
          {!open && <SidebarTrigger className="rounded-full hover:bg-gray-100 dark:hover:bg-[#515151]" />}

          {/* Nazwa modelu wyśrodkowana */}
          <HeaderModelSelector />
        </div>
      </div>

      <div className="flex flex-col h-full pt-14">
        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-auto p-4 safe-area-left safe-area-right">
          <div className="max-w-4xl mx-auto">
            {messages.map((message, index) => {
              if (message.role === "user") {
                return <UserMessage key={index}>{message.content}</UserMessage>
              } else {
                return (
                  <React.Fragment key={index}>
                    <AssistantMessage>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </AssistantMessage>
                    <ActionButtons />
                  </React.Fragment>
                )
              }
            })}
            {isLoading && (
              <div className="flex justify-start mb-6">
                <div className="text-gray-900 dark:text-gray-100 px-0 py-0 max-w-xs md:max-w-md lg:max-w-2xl">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
                    <span>Myślę...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Input */}
        <div className="sticky bottom-0 z-10 p-4 bg-background/80 backdrop-blur-sm border-t border-transparent safe-area-bottom safe-area-left safe-area-right">
          <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
            <PromptBox ref={promptBoxRef} name="message" onClear={clearPromptBox} />
          </form>
        </div>
      </div>
    </SidebarInset>
  )
}
