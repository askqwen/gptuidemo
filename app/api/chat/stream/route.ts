import type { NextRequest } from "next/server"
import { streamNvidiaModel, type ChatMessage } from "@/lib/nvidia-client"
import { SYSTEM_PROMPTS, type ModelId } from "@/lib/system-prompts"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, model = "deepseek-ai/deepseek-r1-0528" } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages array is required", { status: 400 })
    }

    // Validate model
    if (!["deepseek-ai/deepseek-r1-0528"].includes(model)) {
      return new Response("Invalid model. Use deepseek-ai/deepseek-r1-0528", { status: 400 })
    }

    // Prepare messages with system prompt
    const systemPrompt = SYSTEM_PROMPTS[model as ModelId]
    const chatMessages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...messages]

    // Get streaming response from NVIDIA
    const stream = await streamNvidiaModel(model, chatMessages)

    // Return streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Stream API Error:", error)
    return new Response(`Error: ${error instanceof Error ? error.message : "Unknown error"}`, { status: 500 })
  }
}
