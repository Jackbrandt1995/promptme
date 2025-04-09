import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"
import { generateCraftPrompt, formatCraftPrompt } from "@/lib/craft-framework"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, template, model } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Generate a CRAFT framework prompt
    const craftPrompt = generateCraftPrompt(prompt, template || "Make this sound more professional")
    const formattedPrompt = formatCraftPrompt(craftPrompt)

    // Create a system prompt that instructs the model to optimize the CRAFT prompt
    const systemPrompt = `You are an expert at optimizing prompts for AI models. 
Your task is to enhance the given prompt based on the CRAFT framework to work optimally with the ${model || "gpt-4"} model.

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
3. Optimizing it specifically for ${model || "gpt-4"}'s capabilities
4. Removing redundancies while keeping the structure
5. Ensuring clarity and specificity

Return ONLY the enhanced prompt without explanations or additional text.`

    try {
      // Use the AI SDK to enhance the prompt
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        prompt: formattedPrompt,
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
    console.error("Error in extension-enhance route:", error)
    return NextResponse.json({ error: error.message || "Failed to enhance prompt" }, { status: 500 })
  }
}
