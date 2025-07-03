const XAI_API_KEY = "xai-atKD7gHH7xoMMrhuohkHDRtSrFd0ShsplvyE6cSMhe4K5NlvgZdQRFZYEGjUpd4Er1v8HpBN2LzyDFuV"
const XAI_API_URL = "https://api.x.ai/v1/chat/completions"

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface XAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function callXAIModel(
  model: "grok-3-mini" | "grok-3-mini-fast",
  messages: ChatMessage[],
): Promise<string> {
  try {
    const response = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`XAI API Error: ${response.status} - ${errorText}`)
    }

    const data: XAIResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from XAI API")
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error("Error calling XAI API:", error)
    throw new Error(`Błąd połączenia z modelem AI: ${error instanceof Error ? error.message : "Nieznany błąd"}`)
  }
}

export async function streamXAIModel(
  model: "grok-3-mini" | "grok-3-mini-fast",
  messages: ChatMessage[],
): Promise<ReadableStream<string>> {
  const response = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`XAI API Error: ${response.status} - ${errorText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("No response body")
  }

  return new ReadableStream({
    start(controller) {
      function pump(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (done) {
            controller.close()
            return
          }

          const chunk = new TextDecoder().decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") {
                controller.close()
                return
              }

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  controller.enqueue(content)
                }
              } catch (e) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }

          return pump()
        })
      }

      return pump()
    },
  })
}
