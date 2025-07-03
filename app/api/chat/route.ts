import { type NextRequest, NextResponse } from "next/server"
import { callNvidiaModel, type ChatMessage } from "@/lib/nvidia-client"
import { SYSTEM_PROMPTS, type ModelId } from "@/lib/system-prompts"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, model = "deepseek-ai/deepseek-r1-0528" } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    // Validate model
    if (!["deepseek-ai/deepseek-r1-0528"].includes(model)) {
      return NextResponse.json({ error: "Invalid model. Use deepseek-ai/deepseek-r1-0528" }, { status: 400 })
    }

    // Prepare messages with system prompt
    const systemPrompt = SYSTEM_PROMPTS[model as ModelId]
    const chatMessages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...messages]

    // Call NVIDIA API
    const response = await callNvidiaModel(model, chatMessages)

    return NextResponse.json({
      message: response,
      model: model,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
