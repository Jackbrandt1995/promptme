import { type NextRequest, NextResponse } from "next/server"
import { QueryBuilder } from "@/lib/query-builder"
import { optimizePrompt } from "@/lib/openai-utils"

// Use the environment variable
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "dummy-key" // Use a dummy key since we're not making API calls

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { selectedOption, userResponses, isGenerateButtonClick } = body

    if (!selectedOption) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const queryBuilder = new QueryBuilder()

    // First, get the follow-up questions
    const followUpQuestions = queryBuilder.getFollowUpQuestions(selectedOption)

    // If this is a generate button click, ALWAYS generate a prompt
    if (isGenerateButtonClick) {
      console.log("Generate button clicked - forcing prompt generation")

      // Build the comprehensive prompt using the CRAFT framework
      const craftPrompt = queryBuilder.buildComprehensivePrompt(selectedOption, userResponses || {})
      console.log("Generated CRAFT prompt:", craftPrompt)

      // Format the prompt (no API call)
      const finalPrompt = await optimizePrompt(OPENAI_API_KEY, craftPrompt)
      console.log("Using formatted CRAFT prompt:", finalPrompt)

      // Always return a prompt
      return NextResponse.json({
        prompt: finalPrompt || `As an expert in ${selectedOption.toLowerCase()}, please help me with this task.`,
        followUpQuestions,
      })
    }

    // If this is just a request for follow-up questions (no userResponses provided),
    // or if we don't have enough information to generate a prompt,
    // return only the follow-up questions
    if (
      !userResponses ||
      Object.keys(userResponses).length === 0 ||
      !queryBuilder.hasEnoughInformation(selectedOption, userResponses)
    ) {
      return NextResponse.json({
        followUpQuestions,
        isFollowUpOnly: true,
      })
    }

    // Build the comprehensive prompt using the CRAFT framework
    const craftPrompt = queryBuilder.buildComprehensivePrompt(selectedOption, userResponses)
    console.log("Generated CRAFT prompt:", craftPrompt)

    // Format the prompt (no API call)
    const finalPrompt = await optimizePrompt(OPENAI_API_KEY, craftPrompt)
    console.log("Using formatted CRAFT prompt:", finalPrompt)

    // Ensure we always return a prompt, even if something went wrong
    if (!finalPrompt || finalPrompt.trim() === "") {
      console.error("Empty prompt generated, using fallback")

      // Create a more comprehensive fallback
      let fallbackPrompt = `As an expert in ${selectedOption.toLowerCase()}, please help me with the following details:`

      if (userResponses && Object.keys(userResponses).length > 0) {
        Object.entries(userResponses).forEach(([question, answer]) => {
          if (answer && answer.trim()) {
            fallbackPrompt += `\n- ${question}: ${answer}`
          }
        })
      }

      return NextResponse.json({
        prompt: fallbackPrompt,
        followUpQuestions,
      })
    }

    // Always return a prompt field in the response
    return NextResponse.json({
      prompt: finalPrompt,
      followUpQuestions,
    })
  } catch (error: any) {
    console.error("Prompt generation error:", error)
    // Always return a prompt, even in case of error
    const fallbackPrompt = `As an expert assistant, please help me with the requested task. I apologize for any inconvenience.`

    return NextResponse.json({
      prompt: fallbackPrompt,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
