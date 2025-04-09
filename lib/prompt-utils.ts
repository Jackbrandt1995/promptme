import { AI_MODELS } from "./data"

interface PromptFramework {
  name: string
  generate: (query: string, modelInfo: any) => string
}

// Intent classification types
type IntentType = "question" | "instruction" | "creative" | "analysis" | "code" | "other"
type TopicType = "technical" | "creative" | "business" | "academic" | "general"

interface AnalyzedQuery {
  intent: IntentType
  topic: TopicType
  keywords: string[]
  complexity: number // 1-5
  requiresFollowUp: boolean
  followUpQuestions?: string[]
  // Add new fields for extracted context
  audience?: string
  purpose?: string
  domain?: string
  format?: string
  tone?: string
}

// Function to analyze user input
function analyzeQuery(query: string): AnalyzedQuery {
  const analysis: AnalyzedQuery = {
    intent: "other",
    topic: "general",
    keywords: [],
    complexity: 1,
    requiresFollowUp: false,
    followUpQuestions: [],
  }

  const queryLower = query.toLowerCase()

  // Extract keywords (enhanced implementation)
  analysis.keywords = queryLower.split(" ").filter((word) => word.length > 3)

  // Detect intent through pattern matching (keep existing code)
  if (queryLower.match(/^(how|what|why|when|where|who|can|could|would|will)/i)) {
    analysis.intent = "question"
  } else if (queryLower.match(/^(write|create|generate|make|design)/i)) {
    analysis.intent = "creative"
  } else if (queryLower.match(/^(analyze|examine|evaluate|assess|compare)/i)) {
    analysis.intent = "analysis"
  } else if (queryLower.match(/^(code|program|implement|debug|function)/i)) {
    analysis.intent = "code"
  }

  // Enhanced topic detection
  if (queryLower.match(/(code|program|api|function|bug|error|database|algorithm)/i)) {
    analysis.topic = "technical"
    analysis.domain = "software development"
  } else if (queryLower.match(/(story|article|blog|essay|content|write|creative)/i)) {
    analysis.topic = "creative"
    analysis.domain = "content creation"
  } else if (queryLower.match(/(business|market|strategy|customer|profit|sales)/i)) {
    analysis.topic = "business"
    analysis.domain = "business"
  } else if (queryLower.match(/(research|study|theory|analysis|academic|paper)/i)) {
    analysis.topic = "academic"
    analysis.domain = "academia"
  }

  // Extract audience
  if (queryLower.includes("cover letter")) {
    if (queryLower.includes("law firm")) {
      analysis.audience = "law firm hiring team"
      analysis.tone = "professional and formal"
      analysis.domain = "legal"
    } else if (queryLower.includes("tech company")) {
      analysis.audience = "tech company recruiters"
      analysis.tone = "professional with technical focus"
      analysis.domain = "technology"
    } else {
      analysis.audience = "hiring managers"
      analysis.tone = "professional"
    }
  } else if (queryLower.includes("blog")) {
    if (queryLower.includes("technical")) {
      analysis.audience = "technical professionals"
      analysis.tone = "technical yet accessible"
    } else {
      analysis.audience = "general readers"
      analysis.tone = "conversational"
    }
  }

  // Extract format
  if (queryLower.includes("blog post")) {
    analysis.format = "blog post"
  } else if (queryLower.includes("cover letter")) {
    analysis.format = "cover letter"
  } else if (queryLower.includes("email")) {
    analysis.format = "email"
  } else if (queryLower.includes("report")) {
    analysis.format = "report"
  }

  // Add to the existing format detection
  if (queryLower.match(/\b(write|draft|compose|create)\b.*(email|message|letter)\b/i)) {
    analysis.format = "email"
  } else if (queryLower.match(/\b(write|create|draft)\b.*(blog|article|post)\b/i)) {
    analysis.format = "blog post"
  } else if (queryLower.match(/\b(write|create|draft)\b.*(report|summary|analysis)\b/i)) {
    analysis.format = "report"
  }

  // Extract purpose
  if (queryLower.includes("explain")) {
    analysis.purpose = "explanation"
  } else if (queryLower.includes("convince") || queryLower.includes("persuade")) {
    analysis.purpose = "persuasion"
  } else if (queryLower.includes("compare")) {
    analysis.purpose = "comparison"
  } else if (queryLower.includes("summarize")) {
    analysis.purpose = "summary"
  }

  // Keep existing complexity calculation
  analysis.complexity = Math.min(
    5,
    Math.ceil(query.split(" ").length / 10) +
      (query.match(/\b(complex|detailed|comprehensive|thorough)\b/gi)?.length || 0),
  )

  // Keep existing follow-up logic
  analysis.requiresFollowUp = false

  return analysis
}

function determineIfFollowUpNeeded(analysis: AnalyzedQuery): boolean {
  // Always require context for common content types that need specific details
  if (analysis.format) {
    switch (analysis.format.toLowerCase()) {
      case "email":
        return !(analysis.audience && analysis.purpose && analysis.tone)
      case "blog post":
        return !(analysis.audience && analysis.tone && analysis.purpose)
      case "report":
        return !(analysis.audience && analysis.purpose && analysis.domain)
      case "cover letter":
        return !(analysis.audience && analysis.purpose && analysis.tone)
    }
  }

  // If the query is too generic (less than 5 meaningful words), require follow-up
  if (analysis.keywords.length < 5 && !analysis.format && !analysis.purpose) {
    return true
  }

  // If we already have comprehensive context, skip follow-ups
  if (analysis.audience && analysis.tone && analysis.format && analysis.purpose) {
    return false
  }

  // For creative content, always ensure we have audience and tone
  if (analysis.intent === "creative" && (!analysis.audience || !analysis.tone)) {
    return true
  }

  // For analysis content, ensure we have purpose and scope
  if (analysis.intent === "analysis" && (!analysis.purpose || !analysis.domain)) {
    return true
  }

  // For technical content, ensure we have specific requirements
  if (analysis.topic === "technical" && !analysis.domain) {
    return true
  }

  return false
}

function generateFollowUpQuestions(analysis: AnalyzedQuery): string[] {
  const questions: string[] = []

  // Format-specific questions
  if (analysis.format) {
    switch (analysis.format.toLowerCase()) {
      case "email":
        if (!analysis.audience)
          questions.push("Who is the recipient of this email? (e.g., 'client', 'team member', 'hiring manager')")
        if (!analysis.purpose)
          questions.push(
            "What is the main purpose of this email? (e.g., 'follow up on meeting', 'project proposal', 'job application')",
          )
        if (!analysis.tone)
          questions.push(
            "What tone should the email have? (e.g., 'professional and formal', 'friendly but professional', 'direct and concise')",
          )
        break
      case "blog post":
        if (!analysis.audience)
          questions.push(
            "Who is the target audience for this blog post? (e.g., 'tech professionals', 'beginners', 'business leaders')",
          )
        if (!analysis.tone)
          questions.push("What tone should the content have? (e.g., 'conversational', 'technical', 'educational')")
        if (!analysis.purpose)
          questions.push("What is the main goal of this blog post? (e.g., 'educate', 'inform', 'persuade')")
        break
      case "report":
        if (!analysis.audience)
          questions.push("Who will be reading this report? (e.g., 'executive team', 'stakeholders', 'technical team')")
        if (!analysis.purpose)
          questions.push(
            "What is the main objective of this report? (e.g., 'status update', 'analysis findings', 'recommendations')",
          )
        if (!analysis.domain)
          questions.push(
            "What is the specific domain or context? (e.g., 'project performance', 'market analysis', 'technical evaluation')",
          )
        break
    }
  } else {
    // Generic content questions based on intent
    switch (analysis.intent) {
      case "creative":
        if (!analysis.audience) questions.push("Who is the target audience for this content?")
        if (!analysis.tone)
          questions.push("What tone or style would you prefer? (e.g., 'professional', 'casual', 'technical')")
        if (!analysis.purpose) questions.push("What is the main purpose or goal of this content?")
        break
      case "analysis":
        if (!analysis.purpose) questions.push("What specific aspects need to be analyzed?")
        if (!analysis.domain) questions.push("What is the context or domain for this analysis?")
        break
      case "code":
        if (!analysis.domain) questions.push("What programming language or framework should be used?")
        questions.push("Are there any specific requirements or constraints?")
        break
      default:
        // For generic queries, ask for basic context
        if (!analysis.purpose) questions.push("What is the main goal or purpose?")
        if (!analysis.audience) questions.push("Who is the intended audience?")
        if (!analysis.tone) questions.push("What tone would you like? (e.g., 'formal', 'casual', 'technical')")
    }
  }

  return questions
}

// RISEN Framework
const RISEN: PromptFramework = {
  name: "RISEN",
  generate: (query: string, modelInfo: any) => {
    const analysis = analyzeQuery(query)
    return `Role: I want you to act as an expert AI assistant${analysis.domain ? ` with deep knowledge in ${analysis.domain}` : ""}.

Input: ${query}

Steps:
1. Analyze the query thoroughly
2. Consider the context and requirements${analysis.audience ? `\n   - Target audience: ${analysis.audience}` : ""}${analysis.tone ? `\n   - Tone: ${analysis.tone}` : ""}${analysis.format ? `\n   - Format: ${analysis.format}` : ""}${analysis.purpose ? `\n   - Purpose: ${analysis.purpose}` : ""}
3. Apply domain-specific knowledge
4. Generate a comprehensive response
5. Review and refine the output

Notice: Consider these key points from your capabilities:
${modelInfo.capabilities.map((cap: string) => `- ${cap}`).join("\n")}

Please provide your response based on this framework.`
  },
}

// CRAFT Framework
const CRAFT: PromptFramework = {
  name: "CRAFT",
  generate: (query: string, modelInfo: any) => {
    const analysis = analyzeQuery(query)
    return `Context: You are an AI assistant${analysis.domain ? ` specializing in ${analysis.domain}` : ""} with the following capabilities:
${modelInfo.capabilities.map((cap: string) => `- ${cap}`).join("\n")}

Role: Expert AI assistant${analysis.domain ? ` in ${analysis.domain}` : ""}

Audience: ${analysis.audience || "User seeking assistance with their query"}${analysis.tone ? `\nTone: ${analysis.tone}` : ""}

Format: ${analysis.format || "Clear, structured response with appropriate formatting"}${analysis.purpose ? `\nPurpose: ${analysis.purpose}` : ""}

Task: ${query}

Please provide your response based on these parameters.`
  },
}

// RTF Framework
const RTF: PromptFramework = {
  name: "RTF",
  generate: (query: string, modelInfo: any) => {
    const analysis = analyzeQuery(query)
    return `Role: Expert AI assistant${analysis.domain ? ` in ${analysis.domain}` : ""} with these capabilities:
${modelInfo.capabilities.map((cap: string) => `- ${cap}`).join("\n")}

Task: ${query}

Format: Provide a clear, well-structured response that:
- Addresses the query directly${analysis.audience ? `\n- Is tailored for ${analysis.audience}` : ""}${analysis.tone ? `\n- Uses a ${analysis.tone} tone` : ""}${analysis.format ? `\n- Follows ${analysis.format} format` : ""}${analysis.purpose ? `\n- Achieves the purpose of ${analysis.purpose}` : ""}
- Uses appropriate formatting
- Follows best practices for this type of task`
  },
}

// Helper function to select the best framework for each model
function selectFramework(modelId: string): PromptFramework {
  // Framework selection based on model characteristics
  switch (modelId) {
    // ChatGPT models - RISEN for more complex models, RTF for simpler ones
    case "gpt-4":
    case "gpt-4-turbo":
    case "gpt-4o":
    case "o1":
      return RISEN
    case "gpt-3.5-turbo":
    case "o1-mini":
    case "o3-mini":
    case "o3-mini-high":
      return RTF

    // Claude models - CRAFT for better structured outputs
    case "claude-3-opus":
    case "claude-3-sonnet":
    case "claude-3-haiku":
      return CRAFT

    // Perplexity models - RTF for direct, clear instructions
    case "pplx-7b-online":
    case "pplx-70b-online":
      return RTF

    // Gemini models - RISEN for complex tasks
    case "gemini-pro":
    case "gemini-ultra":
      return RISEN

    // GitHub Copilot - CRAFT for structured technical tasks
    case "copilot":
      return CRAFT

    // Default to RTF for unknown models
    default:
      return RTF
  }
}

// Add model-specific formatting
function addModelSpecificFormatting(prompt: string, modelId: string): string {
  let formattedPrompt = prompt

  // Add model-specific prefixes or formatting
  switch (modelId) {
    case "claude-3-opus":
    case "claude-3-sonnet":
    case "claude-3-haiku":
      // Remove the Human/Assistant formatting for Claude models
      formattedPrompt = prompt
      break

    case "gemini-pro":
    case "gemini-ultra":
      formattedPrompt = `You are an expert AI assistant. ${formattedPrompt}`
      break

    case "copilot":
      formattedPrompt = `// ${formattedPrompt.replace(/\n/g, "\n// ")}`
      break
  }

  return formattedPrompt
}

// Add intent-specific template
function addIntentTemplate(prompt: string, analysis: AnalyzedQuery): string {
  let template = ""

  switch (analysis.intent) {
    case "question":
      template = `
Approach this question with:
1. Clear, direct answer
2. Supporting explanation
3. Relevant examples
4. Additional context if needed`
      break
    case "creative":
      template = `
Creative Guidelines:
1. Original and engaging content
2. Appropriate tone and style
3. Clear structure and flow
4. Target audience consideration`
      break
    case "analysis":
      template = `
Analysis Framework:
1. Systematic examination
2. Key factors identification
3. Evidence-based evaluation
4. Clear conclusions`
      break
    case "code":
      template = `
Code Development:
1. Clear requirements understanding
2. Efficient implementation
3. Best practices adherence
4. Documentation and comments`
      break
  }

  return prompt + "\n" + template
}

// Update the generatePrompt function
export function generatePrompt(modelId: string, query: string): string {
  const modelInfo = AI_MODELS[modelId]
  if (!modelInfo) {
    throw new Error(`Unknown AI model: ${modelId}`)
  }

  // Analyze the query
  const analysis = analyzeQuery(query)

  // If we need follow-up information, return the questions
  if (analysis.requiresFollowUp) {
    return `Before proceeding, please ask the following clarifying questions:\n${analysis.followUpQuestions?.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
  }

  // Select and apply the appropriate framework
  const framework = selectFramework(modelId)
  let prompt = framework.generate(query, modelInfo)

  // Add intent-specific template
  prompt = addIntentTemplate(prompt, analysis)

  // Add model-specific formatting
  return addModelSpecificFormatting(prompt, modelId)
}

// Helper function to merge query and context naturally
function mergeQueryAndContext(query: string, followUpAnswers: Record<string, string>): string {
  // Remove common question words from the start if present
  const cleanQuery = query.replace(/^(can you |please |could you |would you )/i, "")

  // Extract key information from follow-up answers
  const contextPoints = Object.values(followUpAnswers).map((answer) => {
    // Clean up the answer and remove any question artifacts
    return answer.replace(/^(the |it should be |i want |i need |make it )/i, "").trim()
  })

  // Combine query and context into a natural sentence
  let enhancedQuery = cleanQuery

  // Remove trailing punctuation before adding context
  enhancedQuery = enhancedQuery.replace(/[.!?]+$/, "")

  // Add context naturally based on the query structure
  if (contextPoints.length > 0) {
    // Join multiple context points with appropriate conjunctions
    const contextString =
      contextPoints.length === 1
        ? contextPoints[0]
        : contextPoints.slice(0, -1).join(", ") + " and " + contextPoints.slice(-1)

    // Check if the query already contains any of the context points
    const containsContext = contextPoints.some((point) => enhancedQuery.toLowerCase().includes(point.toLowerCase()))

    if (!containsContext) {
      // Add context in a natural way
      if (
        enhancedQuery.toLowerCase().includes("write") ||
        enhancedQuery.toLowerCase().includes("create") ||
        enhancedQuery.toLowerCase().includes("generate")
      ) {
        enhancedQuery += ` that is ${contextString}`
      } else {
        enhancedQuery += ` with ${contextString}`
      }
    }
  }

  // Ensure proper punctuation
  enhancedQuery = enhancedQuery.trim() + "."

  // Capitalize first letter
  return enhancedQuery.charAt(0).toUpperCase() + enhancedQuery.slice(1)
}

async function enhanceQueryWithAI(query: string, followUpAnswers: Record<string, string>): Promise<string> {
  try {
    console.log("Enhancing query:", { query, followUpAnswers })

    const response = await fetch("/api/enhance-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        context: followUpAnswers,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Enhancement API Error:", errorData)
      throw new Error(errorData.error || "Failed to enhance prompt")
    }

    const data = await response.json()

    if (!data.enhancedText) {
      console.error("No enhanced text returned:", data)
      throw new Error("No enhanced text returned from API")
    }

    console.log("Successfully enhanced query:", data.enhancedText)
    return data.enhancedText
  } catch (error) {
    console.error("Error enhancing query:", error)
    // Fallback to the original merging function if AI enhancement fails
    console.log("Falling back to manual merge")
    return mergeQueryAndContext(query, followUpAnswers)
  }
}

// Update the generateEnhancedPrompt function to handle errors better
export async function generateEnhancedPrompt(
  modelId: string,
  query: string,
  followUpAnswers: Record<string, string>,
): Promise<string> {
  try {
    console.log("Generating enhanced prompt:", { modelId, query, followUpAnswers })

    const modelInfo = AI_MODELS[modelId]
    if (!modelInfo) {
      throw new Error(`Unknown AI model: ${modelId}`)
    }

    // Analyze the original query
    const analysis = analyzeQuery(query)

    // Use AI to enhance the query combination
    const enhancedQuery = await enhanceQueryWithAI(query, followUpAnswers)

    // Select and apply the appropriate framework
    const framework = selectFramework(modelId)
    let prompt = framework.generate(enhancedQuery, modelInfo)

    // Add intent-specific template
    prompt = addIntentTemplate(prompt, analysis)

    // Add model-specific formatting
    const finalPrompt = addModelSpecificFormatting(prompt, modelId)

    console.log("Successfully generated enhanced prompt")
    return finalPrompt
  } catch (error) {
    console.error("Error in generateEnhancedPrompt:", error)
    throw error
  }
}

export function getVersionInfo(modelId: string) {
  if (!AI_MODELS[modelId]) {
    throw new Error(`Unknown AI model: ${modelId}`)
  }
  return AI_MODELS[modelId]
}

// This is a simplified version of the prompt utilities from the main project
// In a real extension, this would interact with background scripts

import { MODEL_FORMATTING } from "./model-formats"

// Helper function to enhance a prompt based on template type
export async function enhancePrompt(model: string, prompt: string, template: string): Promise<string> {
  // In a real extension, this would call a background script or API
  // Here we'll implement a simplified version for demonstration

  const templatePrompts: Record<string, string> = {
    "Make this sound more professional": `Rewrite the following text to sound more professional, using formal language and proper business terminology while maintaining the original meaning:\n\n${prompt}`,
    "Simplify this text": `Rewrite the following text to be simpler and easier to understand, while preserving all important information:\n\n${prompt}`,
    "Soften this language (make it sound nicer)": `Rewrite the following text to sound more diplomatic, positive, and tactful while preserving the core message:\n\n${prompt}`,
    "Analyze this text": `Provide a structured analysis of the following text, including key points, themes, strengths, and weaknesses:\n\n${prompt}`,
    "Draft an email": `Create a professional email based on the following information:\n\n${prompt}`,
    "Draft a memo": `Create a formal memo based on the following information:\n\n${prompt}`,
    "Write a letter": `Create a formal letter based on the following information:\n\n${prompt}`,
    "Develop a workout plan": `Create a detailed workout plan based on the following information:\n\n${prompt}`,
    "Help me with my investment portfolio": `Provide investment portfolio advice based on the following information:\n\n${prompt}`,
    Other: prompt,
  }

  // Look up the template, or use a default enhancement approach
  const enhancementPrompt =
    templatePrompts[template] ||
    `Enhance the following prompt to be more specific, clear, and effective for an AI model:\n\n${prompt}`

  // Apply model-specific formatting
  const modelFormat = MODEL_FORMATTING[model as keyof typeof MODEL_FORMATTING] || {
    prefix: "",
    suffix: "",
  }

  // In a real extension, we would call an API here
  // For now, just add some enhancement indicators
  const enhancedText = await mockEnhancement(enhancementPrompt)

  return modelFormat.prefix + enhancedText + modelFormat.suffix
}

// Mock function to simulate API call for enhancement
async function mockEnhancement(prompt: string): Promise<string> {
  // In a real extension, this would call an actual API
  return new Promise((resolve) => {
    setTimeout(() => {
      const inputText = prompt.split("\n\n")[1] || prompt

      // Simple enhancement logic - add structure and clarity
      let enhanced = inputText

      // Add some fake "enhancement" to demonstrate
      if (!enhanced.includes("Context:") && !enhanced.includes("Background:")) {
        enhanced = applySimpleEnhancement(enhanced)
      }

      resolve(enhanced)
    }, 500) // Simulate API delay
  })
}

// Apply a simple enhancement to demonstrate functionality
function applySimpleEnhancement(text: string): string {
  // For demo purposes only - in real extension this would use the CRAFT framework
  // or call an external API

  // Check if it's a question
  if (text.trim().endsWith("?")) {
    return `I'm looking for a comprehensive and well-structured answer to the following question:\n\n${text}\n\nPlease include relevant examples and context in your response.`
  }

  // Check if it's a short phrase
  if (text.split(" ").length < 5) {
    return `I need detailed information about ${text}. Please provide a comprehensive overview including key concepts, applications, and examples.`
  }

  // Default enhancement structure
  return `I need assistance with the following task:\n\n${text}\n\nPlease provide a thorough, well-structured response with clear explanations and specific examples where appropriate.`
}
