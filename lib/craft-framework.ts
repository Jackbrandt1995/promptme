// Implementation of the CRAFT framework for prompt enhancement

export interface CraftPrompt {
  context: string
  role: string
  audience: string
  format: string
  tone: string
  task: string
}

// Generate a prompt using the CRAFT framework
export function generateCraftPrompt(basePrompt: string, template: string): CraftPrompt {
  // Initialize the CRAFT prompt with empty values
  const craftPrompt: CraftPrompt = {
    context: "",
    role: "",
    audience: "",
    format: "",
    tone: "",
    task: "",
  }

  // Fill in the template-specific CRAFT framework
  switch (template) {
    case "Make this sound more professional":
      craftPrompt.context = `I need to rewrite the following text in a more professional tone: ${basePrompt}`
      craftPrompt.role = "You are an expert editor specializing in professional business communication."
      craftPrompt.audience = "The text is intended for a professional business audience."
      craftPrompt.format = "Rewrite the text using professional language, proper grammar, and formal structure."
      craftPrompt.tone = "Use a formal, professional tone that conveys competence and authority."
      craftPrompt.task =
        "Please rewrite the provided text to sound more professional while maintaining its original meaning."
      break

    case "Simplify this text":
      craftPrompt.context = `I need to simplify the following text while preserving all important information: ${basePrompt}`
      craftPrompt.role = "You are an expert in clear communication and simplifying complex information."
      craftPrompt.audience = "The text should be understandable to a general audience with basic comprehension."
      craftPrompt.format = "Maintain the original meaning while using simpler language and structure."
      craftPrompt.tone = "Use a clear, straightforward tone that is easy to understand."
      craftPrompt.task = "Please simplify the provided text while preserving all important information."
      break

    case "Soften this language (make it sound nicer)":
      craftPrompt.context = `I need to rewrite the following text to sound more diplomatic and positive: ${basePrompt}`
      craftPrompt.role = "You are an expert in diplomatic and tactful communication."
      craftPrompt.audience = "The message needs to maintain a positive relationship with the recipient."
      craftPrompt.format = "Rewrite using more diplomatic, positive language while preserving the core message."
      craftPrompt.tone = "Use a warm, empathetic, and positive tone."
      craftPrompt.task =
        "Please rewrite the provided text to sound more diplomatic and constructive while conveying the same information."
      break

    case "Analyze this text":
      craftPrompt.context = `I need to analyze the following text: ${basePrompt}`
      craftPrompt.role = "You are an expert analyst with strong critical thinking and evaluation skills."
      craftPrompt.audience = "The analysis should be appropriate for someone seeking objective insights."
      craftPrompt.format =
        "Provide a structured analysis with key points, themes, strengths, weaknesses, and recommendations."
      craftPrompt.tone = "Use an objective, analytical tone that is balanced and evidence-based."
      craftPrompt.task =
        "Please analyze the provided text, identifying its key elements, strengths, weaknesses, and implications."
      break

    // Add more templates here

    default:
      // Default enhancement for any prompt
      craftPrompt.context = `I need help with the following: ${basePrompt}`
      craftPrompt.role = "You are an expert AI assistant with deep knowledge in relevant domains."
      craftPrompt.audience = "Your response should be clear and helpful for someone seeking assistance."
      craftPrompt.format = "Provide a clear, well-structured response with appropriate formatting."
      craftPrompt.tone = "Use a helpful, informative tone."
      craftPrompt.task = "Please respond to my request effectively, providing comprehensive and useful information."
  }

  return craftPrompt
}

// Format the CRAFT prompt into a string
export function formatCraftPrompt(craftPrompt: CraftPrompt): string {
  return `# CRAFT FRAMEWORK PROMPT

## Context:
${craftPrompt.context}

## Role:
${craftPrompt.role}

## Audience:
${craftPrompt.audience}

## Format:
${craftPrompt.format}

## Tone:
${craftPrompt.tone}

## Task:
${craftPrompt.task}`
}

// Format the CRAFT prompt into a condensed string for actual use
export function condenseCraftPrompt(craftPrompt: CraftPrompt): string {
  return `${craftPrompt.role} ${craftPrompt.task} ${craftPrompt.format} ${craftPrompt.tone}`
}
