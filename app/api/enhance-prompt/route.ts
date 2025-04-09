import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, template = "Make this sound more professional", model = "gpt-4o" } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Create a system prompt that instructs the model to optimize the prompt
    const systemPrompt = `You are an expert at optimizing prompts for AI models. 
Your task is to enhance the given prompt to work optimally with the ${model} model.

Enhance the prompt by:
1. Preserving all important information
2. Making it more natural and conversational
3. Optimizing it specifically for ${model}'s capabilities
4. Adding structure and clarity
5. Ensuring specificity and actionability

The template selected is: "${template}"

Return ONLY the enhanced prompt without explanations or additional text.`

    try {
      // Use the AI SDK to enhance the prompt
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        prompt: `Original prompt: "${prompt}"`,
        temperature: 0.7,
        maxTokens: 2000,
      })

      return NextResponse.json({
        enhancedPrompt: text.trim(),
        originalPrompt: prompt,
      })
    } catch (aiError: any) {
      console.error("AI Enhancement Error:", aiError)

      // If OpenAI enhancement fails, return a basic enhancement
      return NextResponse.json({
        enhancedPrompt: `I need assistance with the following: ${prompt}. Please provide a detailed, well-structured response.`,
        originalPrompt: prompt,
        error: "Failed to enhance with OpenAI, using basic enhancement",
      })
    }
  } catch (error: any) {
    console.error("Error in enhance-prompt route:", error)
    return NextResponse.json({ error: error.message || "Failed to enhance prompt" }, { status: 500 })
  }
}
