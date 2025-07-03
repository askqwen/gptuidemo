export const SYSTEM_PROMPTS = {
  "deepseek-ai/deepseek-r1-0528": `You are a helpful AI assistant. Respond in Polish language.`,
} as const

export type ModelId = keyof typeof SYSTEM_PROMPTS
