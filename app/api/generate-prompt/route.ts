import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"
import { generatePrompt, getVersionInfo } from "@/lib/prompt-utils"

async function enhanceQueryWithAI(version: string, query: string, context: Record<string, string>) {
  const systemPrompt = `You are an expert at refining queries for AI models. Your task is to:

1. Analyze the user's query and provided context
2. Create a single, well-written query that:
   - Incorporates all context naturally
   - Maintains the original intent
   - Is specific and actionable
   - Uses professional language
   - Removes unnecessary words or repetition

Return only the enhanced query without any extra text or explanations.`

  const contextString = Object.entries(context)
    .map(([question, answer]) => `${question}: ${answer}`)
    .join("\n")

  const userPrompt = `Original Query: ${query}

Additional Context:
${contextString}

Please create an enhanced, well-written query combining all this information.`

  try {
    const { text } = await generateText({
      model: openai("gpt-4"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 500,
    })

    return text.trim()
  } catch (error) {
    console.error("Error enhancing query:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { version, query } = body

    if (!version || !query) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Generate prompt directly using the framework
    const prompt = generatePrompt(version, query)

    // Ensure prompt is a string
    if (typeof prompt !== "string") {
      throw new Error("Generated prompt must be a string")
    }

    return NextResponse.json({
      prompt: prompt,
      versionInfo: getVersionInfo(version),
    })
  } catch (error: any) {
    console.error("Error generating prompt:", error)
    return NextResponse.json({ error: error.message || "Failed to generate prompt" }, { status: 500 })
  }
}
