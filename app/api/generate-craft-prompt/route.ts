import { type NextRequest, NextResponse } from "next/server"
import { MODEL_FORMATTING } from "@/lib/model-formats"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, template, userInputs } = body

    if (!model || !template) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    let craftPrompt = ""

    // Special handling for "Other" template
    if (template === "Other") {
      const userInput = userInputs["Enter your prompt"] || ""

      // First enhance the user input with OpenAI
      try {
        const enhancedInput = await enhanceUserInput(userInput)
        // Then build the CRAFT prompt with the enhanced input
        craftPrompt = buildCraftPromptForOther(enhancedInput)
      } catch (enhanceError) {
        console.error("Error enhancing user input:", enhanceError)
        // Fallback to original input if enhancement fails
        craftPrompt = buildCraftPromptForOther(userInput)
      }
    } else {
      // Normal processing for all other templates
      craftPrompt = buildCraftPrompt(template, userInputs)
    }

    try {
      // Send the CRAFT prompt to be optimized by OpenAI
      const optimizeResponse = await fetch(new URL("/api/optimize-prompt", request.url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          craftPrompt,
        }),
      })

      if (!optimizeResponse.ok) {
        throw new Error("Failed to optimize prompt")
      }

      const optimizeData = await optimizeResponse.json()

      return NextResponse.json({
        prompt: optimizeData.enhancedPrompt,
        originalPrompt: craftPrompt,
      })
    } catch (optimizeError) {
      console.error("Optimization error:", optimizeError)

      // Fallback to the original prompt with model-specific formatting if optimization fails
      const modelFormat = MODEL_FORMATTING[model] || { prefix: "", suffix: "" }
      const finalPrompt = modelFormat.prefix + craftPrompt + modelFormat.suffix

      return NextResponse.json({
        prompt: finalPrompt,
        originalPrompt: craftPrompt,
        error: "Failed to optimize prompt, using original",
      })
    }
  } catch (error: any) {
    console.error("Error generating prompt:", error)
    return NextResponse.json({ error: error.message || "Failed to generate prompt" }, { status: 500 })
  }
}

// Function to enhance user input using OpenAI
async function enhanceUserInput(userInput: string): Promise<string> {
  if (!userInput.trim()) {
    return userInput
  }

  const systemPrompt = `You are an expert at enhancing user prompts to make them more effective for AI models.
Your task is to:
1. Analyze the user's input
2. Identify the core request or task
3. Add relevant context, specificity, and structure
4. Make it more comprehensive and clear
5. Preserve the original intent and meaning

Return ONLY the enhanced prompt without explanations or additional text.`

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `Enhance this prompt for better AI response: "${userInput}"`,
      temperature: 0.7,
      maxTokens: 1000,
    })

    return text.trim()
  } catch (error) {
    console.error("Error enhancing user input with OpenAI:", error)
    throw error
  }
}

// Special CRAFT prompt builder for the "Other" template
function buildCraftPromptForOther(enhancedInput: string): string {
  return `Context:
${enhancedInput}

Role:
You are an expert assistant with deep knowledge in the relevant domains needed to address this request.

Audience:
The content should be appropriate for the intended audience implied in the request.

Format:
Provide a clear, well-structured response with appropriate formatting for the content.

Tone:
Use a clear, appropriate tone that matches the purpose and audience of the content.

Task:
Respond to the request thoroughly and effectively, addressing all aspects mentioned.`
}

function buildCraftPrompt(template: string, userInputs: Record<string, string>): string {
  let prompt = ""

  // Context section
  prompt += "Context:\n"
  switch (template) {
    case "Draft an email":
      const emailRecipient = userInputs["Who is the recipient of the email?"] || ""
      const emailPurpose = userInputs["What is the primary purpose of the email?"] || ""
      prompt += `I need to write a professional email${emailRecipient ? ` to ${emailRecipient}` : ""}${emailPurpose ? ` regarding ${emailPurpose}` : ""}.\n\n`
      break

    case "Draft a memo":
      const memoRecipient = userInputs["Who is the memo addressed to?"] || ""
      const memoTopic = userInputs["What is the main topic of the memo?"] || ""
      const memoInfo = userInputs["What key information needs to be communicated?"] || ""
      prompt += `I need to create a formal memo${memoRecipient ? ` for ${memoRecipient}` : ""}${memoTopic ? ` about ${memoTopic}` : ""}${memoInfo ? ` that communicates ${memoInfo}` : ""}.\n\n`
      break

    case "Write a letter":
      const letterType = userInputs["Is this a personal or professional letter?"] || ""
      const letterRecipient = userInputs["Who is the recipient?"] || ""
      const letterPurpose = userInputs["What is the primary purpose of the letter?"] || ""
      prompt += `I need to write a ${letterType ? `${letterType} ` : ""}letter${letterRecipient ? ` to ${letterRecipient}` : ""}${letterPurpose ? ` regarding ${letterPurpose}` : ""}.\n\n`
      break

    case "Simplify this text":
    case "Make this sound more professional":
    case "Soften this language (make it sound nicer)":
    case "Analyze this text":
      const text = userInputs["Provide the text"] || ""
      if (text) {
        prompt += `I need to ${template.toLowerCase()} the following text:\n\n${text}\n\n`
      } else {
        prompt += `I need to ${template.toLowerCase()}.\n\n`
      }
      break

    case "Develop a workout plan":
      const fitnessGoals = userInputs["What are your fitness goals?"] || ""
      const limitations = userInputs["Do you have any physical limitations?"] || ""
      prompt += `I need to develop a workout plan${fitnessGoals ? ` to achieve these goals: ${fitnessGoals}` : ""}.${limitations ? ` Physical limitations to consider: ${limitations}` : ""}\n\n`
      break

    case "Help me with my investment portfolio":
      const accountType = userInputs["What type of investment account? (retirement, brokerage, etc.)"] || ""
      const guidelines = userInputs["Are there specific guidelines you want me to follow?"] || ""
      const riskTolerance = userInputs["Is your risk tolerance low, medium, or high?"] || ""
      prompt += `I need help with my ${accountType || "investment"} portfolio.${guidelines ? ` Guidelines to follow: ${guidelines}.` : ""}${riskTolerance ? ` Risk tolerance: ${riskTolerance}.` : ""}\n\n`
      break

    default:
      prompt += `I need assistance with ${template.toLowerCase()}.\n\n`
  }

  // Role section
  prompt += "Role:\n"
  switch (template) {
    case "Draft an email":
      prompt += "You are an expert communication specialist with experience in professional email writing.\n\n"
      break

    case "Draft a memo":
      prompt += "You are a professional business writer with expertise in creating effective memos.\n\n"
      break

    case "Write a letter":
      const letterType = userInputs["Is this a personal or professional letter?"] || "professional"
      prompt += `You are an expert in ${letterType} letter writing with strong communication skills.\n\n`
      break

    case "Make this sound more professional":
      const industry = userInputs["What industry or context is this for?"] || ""
      prompt += `You are a professional editor with expertise in business communication${industry ? ` for the ${industry} industry` : ""}.\n\n`
      break

    case "Simplify this text":
      prompt += "You are an expert in clear communication and simplifying complex information.\n\n"
      break

    case "Soften this language (make it sound nicer)":
      prompt += "You are an expert in diplomatic and tactful communication.\n\n"
      break

    case "Analyze this text":
      const analysisContext = userInputs["What industry or context is this for?"] || ""
      prompt += `You are an expert analyst${analysisContext ? ` in the ${analysisContext} field` : ""} with strong critical thinking and evaluation skills.\n\n`
      break

    case "Develop a workout plan":
      prompt +=
        "You are a certified personal trainer and fitness expert with experience creating customized workout plans.\n\n"
      break

    case "Help me with my investment portfolio":
      prompt += "You are a financial advisor with expertise in investment management and portfolio optimization.\n\n"
      break

    default:
      prompt += `You are an expert in ${template.toLowerCase()}.\n\n`
  }

  // Audience section
  prompt += "Audience:\n"
  switch (template) {
    case "Draft an email":
      const emailRecipient = userInputs["Who is the recipient of the email?"] || ""
      prompt += emailRecipient
        ? `The email is intended for ${emailRecipient}.\n\n`
        : "The content should be appropriate for the intended recipient.\n\n"
      break

    case "Draft a memo":
      const memoRecipient = userInputs["Who is the memo addressed to?"] || ""
      prompt += memoRecipient
        ? `The memo is addressed to ${memoRecipient}.\n\n`
        : "The memo should be appropriate for the intended recipients.\n\n"
      break

    case "Write a letter":
      const letterRecipient = userInputs["Who is the recipient?"] || ""
      prompt += letterRecipient
        ? `The letter is addressed to ${letterRecipient}.\n\n`
        : "The letter should be appropriate for the intended recipient.\n\n"
      break

    case "Make this sound more professional":
      const audience = userInputs["Who is the intended audience?"] || ""
      prompt += audience
        ? `The content is intended for ${audience}.\n\n`
        : "The content should be appropriate for a professional audience.\n\n"
      break

    case "Simplify this text":
      const readingLevel = userInputs["What is the target audience's reading level?"] || ""
      prompt += readingLevel
        ? `The target audience has a ${readingLevel} reading level.\n\n`
        : "The content should be simplified for general understanding.\n\n"
      break

    default:
      prompt += "The content should be appropriate for the intended recipients.\n\n"
  }

  // Format section
  prompt += "Format:\n"
  switch (template) {
    case "Draft an email":
      prompt += "Include a subject line, greeting, body paragraphs, and a professional closing.\n\n"
      break

    case "Draft a memo":
      prompt +=
        "Structure the memo with a header (TO, FROM, DATE, SUBJECT), summary, body with key points, and conclusion.\n\n"
      break

    case "Write a letter":
      const letterType = userInputs["Is this a personal or professional letter?"] || "professional"
      prompt += `Format as a proper ${letterType} letter with date, address, salutation, body paragraphs, closing, and signature line.\n\n`
      break

    case "Simplify this text":
      prompt +=
        "Maintain the original meaning while using simpler language and structure. Preserve important information.\n\n"
      break

    case "Make this sound more professional":
      const guidelines = userInputs["Are there specific style guidelines to follow?"] || ""
      prompt += `Rewrite the text using professional language, proper grammar, and a formal structure${guidelines ? ` following these guidelines: ${guidelines}` : ""}.\n\n`
      break

    case "Soften this language (make it sound nicer)":
      prompt +=
        "Rewrite the text using more diplomatic, positive, and tactful language while preserving the core message.\n\n"
      break

    case "Analyze this text":
      const purpose = userInputs["What is the primary purpose of this analysis?"] || ""
      prompt += `Provide a structured analysis with key points, themes, strengths, weaknesses, and recommendations${purpose ? ` focused on ${purpose}` : ""}.\n\n`
      break

    case "Develop a workout plan":
      const daysPerWeek = userInputs["How many days per week can you commit?"] || ""
      prompt += `Include workout schedule${daysPerWeek ? ` for ${daysPerWeek} days per week` : ""}, specific exercises, sets/reps, rest periods, and progression guidelines.\n\n`
      break

    case "Help me with my investment portfolio":
      prompt += "Provide specific investment recommendations, asset allocation, risk assessment, and rationale.\n\n"
      break

    default:
      prompt += "Provide a clear, well-structured response with appropriate formatting.\n\n"
  }

  // Tone section
  prompt += "Tone:\n"
  switch (template) {
    case "Draft an email":
      const emailTone = userInputs["What tone would you like the email to have?"] || ""
      prompt += emailTone
        ? `Use a ${emailTone} tone throughout the email.\n\n`
        : "Use a professional, courteous tone appropriate for business communication.\n\n"
      break

    case "Draft a memo":
      const memoTone = userInputs["What is the desired tone (formal, casual, urgent)?"] || ""
      prompt += memoTone
        ? `Maintain a ${memoTone} tone appropriate for business communication.\n\n`
        : "Use a clear, direct tone appropriate for business communication.\n\n"
      break

    case "Write a letter":
      const letterTone = userInputs["What tone would you like to convey?"] || ""
      prompt += letterTone
        ? `Use a ${letterTone} tone in the letter.\n\n`
        : "Use an appropriate tone that matches the purpose of the letter.\n\n"
      break

    case "Make this sound more professional":
      prompt += "Use a formal, professional tone that conveys competence and authority.\n\n"
      break

    case "Soften this language (make it sound nicer)":
      prompt += "Use a warm, empathetic, and positive tone.\n\n"
      break

    case "Analyze this text":
      prompt += "Use an objective, analytical tone that is balanced and evidence-based.\n\n"
      break

    default:
      prompt += "Use a clear, professional tone that's appropriate for the context.\n\n"
  }

  // Task section
  prompt += "Task:\n"
  switch (template) {
    case "Draft an email":
      const emailPurpose = userInputs["What is the primary purpose of the email?"] || ""
      const emailPoints = userInputs["Are there any specific points you want to include?"] || ""

      prompt += `Write a complete email${emailPurpose ? ` about ${emailPurpose}` : ""}.`

      if (emailPoints) {
        prompt += `\n\nInclude these specific points:\n${emailPoints}`
      }
      break

    case "Draft a memo":
      const memoTopic = userInputs["What is the main topic of the memo?"] || ""
      const memoPoints = userInputs["Are there any specific points you want to include?"] || ""

      prompt += `Create a complete memo${memoTopic ? ` about ${memoTopic}` : ""}.`

      if (memoPoints) {
        prompt += `\n\nInclude these specific points:\n${memoPoints}`
      }
      break

    case "Write a letter":
      const letterPurpose = userInputs["What is the primary purpose of the letter?"] || ""
      const letterPoints = userInputs["Are there any specific points you want to include?"] || ""

      prompt += `Write a complete letter${letterPurpose ? ` regarding ${letterPurpose}` : ""}.`

      if (letterPoints) {
        prompt += `\n\nInclude these specific points:\n${letterPoints}`
      }
      break

    case "Simplify this text":
      const readingLevel = userInputs["What is the target audience's reading level?"] || ""
      const simplificationGoal = userInputs["What is the primary goal of simplification?"] || ""
      const technicalTerms = userInputs["Are there any technical terms that need special attention?"] || ""

      prompt += `Simplify the provided text${readingLevel ? ` for a ${readingLevel} reading level` : ""}${simplificationGoal ? ` with the goal of ${simplificationGoal}` : ""}.`

      if (technicalTerms) {
        prompt += `\n\nPay special attention to these technical terms:\n${technicalTerms}`
      }
      break

    case "Make this sound more professional":
      const industry = userInputs["What industry or context is this for?"] || ""
      const styleGuidelines = userInputs["Are there specific style guidelines to follow?"] || ""

      prompt += `Rewrite the provided text to sound more professional${industry ? ` for the ${industry} industry` : ""}.`

      if (styleGuidelines) {
        prompt += `\n\nFollow these specific guidelines:\n${styleGuidelines}`
      }
      break

    case "Soften this language (make it sound nicer)":
      prompt +=
        "Rewrite the provided text using more diplomatic, positive, and tactful language while preserving the core message."
      break

    case "Analyze this text":
      const analysisPurpose = userInputs["What is the primary purpose of this analysis?"] || ""
      const analysisContext = userInputs["What industry or context is this for?"] || ""

      prompt += `Analyze the provided text${analysisPurpose ? ` for ${analysisPurpose}` : ""}${analysisContext ? ` in the context of ${analysisContext}` : ""}.`
      break

    case "Develop a workout plan":
      const fitnessGoals = userInputs["What are your fitness goals?"] || ""
      const daysPerWeek = userInputs["How many days per week can you commit?"] || ""
      const equipment = userInputs["What equipment do you have access to?"] || ""

      prompt += "Develop a detailed workout plan"

      if (fitnessGoals) {
        prompt += ` to achieve these goals: ${fitnessGoals}`
      }

      if (daysPerWeek) {
        prompt += ` for ${daysPerWeek} days per week`
      }

      if (equipment) {
        prompt += ` using this equipment: ${equipment}`
      }

      prompt += "."
      break

    case "Help me with my investment portfolio":
      const accountType = userInputs["What type of investment account? (retirement, brokerage, etc.)"] || ""
      const guidelines = userInputs["Are there specific guidelines you want me to follow?"] || ""
      const riskTolerance = userInputs["Is your risk tolerance low, medium, or high?"] || ""

      prompt += `Provide detailed investment advice for my ${accountType || "investment"} portfolio`

      if (riskTolerance) {
        prompt += ` with a ${riskTolerance} risk tolerance`
      }

      prompt += "."

      if (guidelines) {
        prompt += `\n\nFollow these specific guidelines:\n${guidelines}`
      }
      break

    default:
      prompt += `Complete the ${template.toLowerCase()} task based on the information provided.`
  }

  return prompt
}
