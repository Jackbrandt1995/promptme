import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"
import { MODEL_FORMATTING } from "@/lib/model-formats"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, craftPrompt } = body

    if (!model || !craftPrompt) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Create a system prompt that instructs the model to optimize the CRAFT prompt
    const systemPrompt = `You are an expert at optimizing prompts for AI models. 
Your task is to enhance the given CRAFT framework prompt to work optimally with the ${model} model.

The CRAFT framework has these components:
- Context: Background information
- Role: The AI's perspective
- Audience: Who will receive the content
- Format: Output structure
- Tone: Communication style
- Task: The specific request

Enhance the prompt by:
1. Preserving all important information
2. Making it more natural and conversational
3. Optimizing it specifically for ${model}'s capabilities
4. Removing redundancies while keeping the structure
5. Ensuring clarity and specificity

Return ONLY the enhanced prompt without explanations or additional text.`

    try {
      // Use the AI SDK to enhance the prompt
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        prompt: craftPrompt,
        temperature: 0.7,
        maxTokens: 2000,
      })

      // Apply model-specific formatting to the enhanced prompt
      const modelFormat = MODEL_FORMATTING[model] || { prefix: "", suffix: "" }
      const finalPrompt = modelFormat.prefix + text.trim() + modelFormat.suffix

      return NextResponse.json({
        enhancedPrompt: finalPrompt,
        originalPrompt: craftPrompt,
      })
    } catch (aiError: any) {
      console.error("AI Enhancement Error:", aiError)

      // If OpenAI enhancement fails, return the original prompt with model formatting
      const modelFormat = MODEL_FORMATTING[model] || { prefix: "", suffix: "" }
      const fallbackPrompt = modelFormat.prefix + craftPrompt + modelFormat.suffix

      return NextResponse.json({
        enhancedPrompt: fallbackPrompt,
        originalPrompt: craftPrompt,
        error: "Failed to enhance with OpenAI, using original prompt",
      })
    }
  } catch (error: any) {
    console.error("Error in optimize-prompt route:", error)
    return NextResponse.json({ error: error.message || "Failed to optimize prompt" }, { status: 500 })
  }
}
