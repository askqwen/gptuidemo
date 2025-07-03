"use client"

import type * as React from "react"
import { useRouter } from "next/navigation"
import { PromptBox } from "../prompt-box-demo"
import { SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { currentModel } from "../lib/model-selector"
import { PWAInstall } from "@/components/pwa-install"

export default function Page() {
  const router = useRouter()
  const { open } = useSidebar()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const message = formData.get("message") as string

    if (!message && !event.currentTarget.querySelector("img")) {
      return
    }

    // Store the message in sessionStorage to pass to chat page
    sessionStorage.setItem("initialMessage", message)
    sessionStorage.setItem("selectedModel", currentModel)

    // Navigate to chat screen
    router.push("/chat")
  }

  return (
    <SidebarInset className="relative flex flex-col items-center justify-center p-4">
      {/* Header with Sidebar Trigger - tylko gdy sidebar jest zamknięty */}
      {!open && (
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center p-4">
          <SidebarTrigger className="rounded-full hover:bg-gray-100 dark:hover:bg-[#515151]" />
        </div>
      )}

      <div className="w-full max-w-xl flex flex-col gap-10">
        <p className="text-center text-3xl text-foreground dark:text-white">How Can I Help You</p>
        <form onSubmit={handleSubmit} className="w-full">
          <PromptBox name="message" />
        </form>
      </div>

      <PWAInstall />
    </SidebarInset>
  )
}
