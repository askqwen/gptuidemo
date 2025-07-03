const NVIDIA_API_KEY = "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"
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface NvidiaResponse {
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

export async function callNvidiaModel(model: "deepseek-ai/deepseek-r1-0528", messages: ChatMessage[]): Promise<string> {
  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.6,
        top_p: 0.7,
        max_tokens: 4096,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NVIDIA API Error: ${response.status} - ${errorText}`)
    }

    const data: NvidiaResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from NVIDIA API")
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error("Error calling NVIDIA API:", error)
    throw new Error(`Błąd połączenia z modelem AI: ${error instanceof Error ? error.message : "Nieznany błąd"}`)
  }
}

export async function streamNvidiaModel(
  model: "deepseek-ai/deepseek-r1-0528",
  messages: ChatMessage[],
): Promise<ReadableStream<string>> {
  const response = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.6,
      top_p: 0.7,
      max_tokens: 4096,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`NVIDIA API Error: ${response.status} - ${errorText}`)
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
                const reasoning = parsed.choices?.[0]?.delta?.reasoning_content
                const content = parsed.choices?.[0]?.delta?.content

                if (reasoning) {
                  controller.enqueue(reasoning)
                }
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
