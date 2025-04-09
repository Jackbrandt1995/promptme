// This file formats the CRAFT prompt without API calls
export async function optimizePrompt(apiKey: string, originalPrompt: string): Promise<string> {
  try {
    console.log("Formatting CRAFT prompt:", originalPrompt.substring(0, 100) + "...")

    // Format the original prompt
    const formattedPrompt = formatCraftPrompt(originalPrompt)
    console.log("Formatted CRAFT prompt:", formattedPrompt.substring(0, 100) + "...")

    return formattedPrompt
  } catch (error) {
    console.error("Prompt formatting error:", error)
    // Return the original prompt if there's an error
    return originalPrompt
  }
}

// Function to format the CRAFT prompt
function formatCraftPrompt(originalPrompt: string): string {
  // Extract the sections from the CRAFT framework
  const sections = extractCraftSections(originalPrompt)

  // Build a cohesive prompt that preserves the user's specific inputs
  let formattedPrompt = ""

  // Start with Context - this often contains the main text to be processed
  if (sections.context) {
    // Check if the context contains text enclosed in triple quotes
    const textMatch = sections.context.match(/"""([\s\S]*?)"""/)

    if (textMatch && textMatch[1]) {
      // If we have text in triple quotes, format it specially
      const mainText = textMatch[1].trim()
      const contextWithoutText = sections.context.replace(/"""[\s\S]*?"""/, "").trim()

      formattedPrompt += contextWithoutText + "\n\nHere is the text to work with:\n\n" + mainText + "\n\n"
    } else {
      formattedPrompt += sections.context + " "
    }
  }

  // Add Role
  if (sections.role) {
    formattedPrompt += sections.role + " "
  }

  // Add Audience
  if (sections.audience) {
    formattedPrompt += sections.audience + " "
  }

  // Add Format
  if (sections.format) {
    formattedPrompt += sections.format + " "
  }

  // Add Tone
  if (sections.tone) {
    formattedPrompt += sections.tone + " "
  }

  // Add Task - this often contains specific points to include
  if (sections.task) {
    // Check if the task contains specific points
    if (sections.task.includes("specific points:")) {
      const parts = sections.task.split("specific points:")

      if (parts.length > 1) {
        formattedPrompt += parts[0].trim() + " "
        formattedPrompt += "\n\nInclude these specific points:\n" + parts[1].trim() + "\n"
      } else {
        formattedPrompt += sections.task + " "
      }
    } else if (sections.task.includes("specific guidelines:")) {
      const parts = sections.task.split("specific guidelines:")

      if (parts.length > 1) {
        formattedPrompt += parts[0].trim() + " "
        formattedPrompt += "\n\nFollow these guidelines:\n" + parts[1].trim() + "\n"
      } else {
        formattedPrompt += sections.task + " "
      }
    } else {
      formattedPrompt += sections.task + " "
    }
  }

  // Clean up the formatting but preserve important structure
  formattedPrompt = formattedPrompt
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .replace(/\.\s+\./g, ".") // Replace consecutive periods
    .replace(/\s+\./g, ".") // Remove spaces before periods
    .replace(/\.\./g, ".") // Replace double periods with single
    .trim()

  // Ensure the prompt ends with appropriate punctuation
  if (
    !formattedPrompt.endsWith(".") &&
    !formattedPrompt.endsWith("!") &&
    !formattedPrompt.endsWith("?") &&
    !formattedPrompt.endsWith("\n")
  ) {
    formattedPrompt += "."
  }

  return formattedPrompt
}

// Helper function to extract sections from the CRAFT framework
function extractCraftSections(originalPrompt: string): {
  context: string
  role: string
  audience: string
  format: string
  tone: string
  task: string
} {
  const lines = originalPrompt.split("\n")
  const sections = {
    context: "",
    role: "",
    audience: "",
    format: "",
    tone: "",
    task: "",
  }

  let currentSection = ""
  let collectingMultilineText = false
  let multilineBuffer = ""

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Determine which section we're in
    if (line.includes("## Context:")) {
      currentSection = "context"
      continue
    } else if (line.includes("## Role:")) {
      if (collectingMultilineText) {
        sections[currentSection as keyof typeof sections] += multilineBuffer
        collectingMultilineText = false
        multilineBuffer = ""
      }
      currentSection = "role"
      continue
    } else if (line.includes("## Audience:")) {
      if (collectingMultilineText) {
        sections[currentSection as keyof typeof sections] += multilineBuffer
        collectingMultilineText = false
        multilineBuffer = ""
      }
      currentSection = "audience"
      continue
    } else if (line.includes("## Format:")) {
      if (collectingMultilineText) {
        sections[currentSection as keyof typeof sections] += multilineBuffer
        collectingMultilineText = false
        multilineBuffer = ""
      }
      currentSection = "format"
      continue
    } else if (line.includes("## Tone:")) {
      if (collectingMultilineText) {
        sections[currentSection as keyof typeof sections] += multilineBuffer
        collectingMultilineText = false
        multilineBuffer = ""
      }
      currentSection = "tone"
      continue
    } else if (line.includes("## Task:")) {
      if (collectingMultilineText) {
        sections[currentSection as keyof typeof sections] += multilineBuffer
        collectingMultilineText = false
        multilineBuffer = ""
      }
      currentSection = "task"
      continue
    }

    // Skip empty lines and headers
    if (line.trim() === "" || line.startsWith("#")) {
      continue
    }

    // Process the line based on the current section
    if (currentSection) {
      // Check for the start of multiline text (like triple quotes)
      if (line.includes('"""') && !collectingMultilineText) {
        collectingMultilineText = true
        multilineBuffer = line + "\n"
      }
      // Check for the end of multiline text
      else if (line.includes('"""') && collectingMultilineText) {
        multilineBuffer += line + "\n"
        sections[currentSection as keyof typeof sections] += multilineBuffer
        collectingMultilineText = false
        multilineBuffer = ""
      }
      // Collecting multiline text
      else if (collectingMultilineText) {
        multilineBuffer += line + "\n"
      }
      // Regular line
      else {
        // Add the line to the appropriate section
        sections[currentSection as keyof typeof sections] += " " + line.trim()
      }
    }
  }

  // Add any remaining multiline buffer
  if (collectingMultilineText && currentSection) {
    sections[currentSection as keyof typeof sections] += multilineBuffer
  }

  // Clean up each section
  Object.keys(sections).forEach((key) => {
    if (typeof sections[key as keyof typeof sections] === "string") {
      sections[key as keyof typeof sections] = (sections[key as keyof typeof sections] as string).trim()
    }
  })

  return sections
}

// Extract recipient information specifically
function extractRecipientInfo(originalPrompt: string): string | null {
  // Check for email recipient
  const emailRecipientMatch =
    originalPrompt.match(/email to ([^.]+)/i) ||
    originalPrompt.match(/email is intended for ([^.]+)/i) ||
    originalPrompt.match(/recipient of the email\?:\s*([^.]+)/i) ||
    originalPrompt.match(/Who is the recipient of the email\?:\s*([^.]+)/i) ||
    originalPrompt.match(/- Who is the recipient of the email\?: ([^.]+)/i)

  if (emailRecipientMatch && emailRecipientMatch[1]) {
    return emailRecipientMatch[1].trim()
  }

  // Check for letter recipient
  const letterRecipientMatch =
    originalPrompt.match(/letter to ([^.]+)/i) ||
    originalPrompt.match(/letter is addressed to ([^.]+)/i) ||
    originalPrompt.match(/Who is the recipient\?:\s*([^.]+)/i) ||
    originalPrompt.match(/- Who is the recipient\?: ([^.]+)/i)

  if (letterRecipientMatch && letterRecipientMatch[1]) {
    return letterRecipientMatch[1].trim()
  }

  // Check for memo recipient
  const memoRecipientMatch =
    originalPrompt.match(/memo for ([^.]+)/i) ||
    originalPrompt.match(/memo is addressed to ([^.]+)/i) ||
    originalPrompt.match(/Who is the memo addressed to\?:\s*([^.]+)/i) ||
    originalPrompt.match(/- Who is the memo addressed to\?: ([^.]+)/i)

  if (memoRecipientMatch && memoRecipientMatch[1]) {
    return memoRecipientMatch[1].trim()
  }

  // Check for audience
  const audienceMatch =
    originalPrompt.match(/audience is ([^.]+)/i) ||
    originalPrompt.match(/intended audience is ([^.]+)/i) ||
    originalPrompt.match(/Who is the intended audience\?:\s*([^.]+)/i) ||
    originalPrompt.match(/- Who is the intended audience\?: ([^.]+)/i)

  if (audienceMatch && audienceMatch[1]) {
    return audienceMatch[1].trim()
  }

  // Check in USER INPUT DETAILS section more thoroughly
  const lines = originalPrompt.split("\n")
  let inUserInputSection = false

  for (const line of lines) {
    if (line.includes("User Input Details") || line.includes("## User Input")) {
      inUserInputSection = true
      continue
    }

    if (inUserInputSection) {
      // Check for any line containing recipient, audience, or addressed to
      if (
        line.includes("recipient") ||
        line.includes("Recipient") ||
        line.includes("audience") ||
        line.includes("Audience") ||
        line.includes("addressed to") ||
        line.includes("Addressed to")
      ) {
        const parts = line.split(":")
        if (parts.length > 1) {
          return parts[1].trim()
        }
      }
    }
  }

  return null
}

// Format the original prompt to be more readable if optimization fails
function formatOriginalPrompt(originalPrompt: string): string {
  // Extract recipient information
  const recipientInfo = extractRecipientInfo(originalPrompt)

  // Remove the header and section labels
  let formatted = originalPrompt
    .replace(/^# CRAFT FRAMEWORK PROMPT\s*/m, "")
    .replace(/^## Context:\s*/m, "")
    .replace(/^## Role:\s*/m, "")
    .replace(/^## Audience:\s*/m, "")
    .replace(/^## Format:\s*/m, "")
    .replace(/^## Tone:\s*/m, "")
    .replace(/^## Task:\s*/m, "")
    .replace(/^## User Input Details.*?:\s*/m, "")

  // Clean up the bullet points
  formatted = formatted.replace(/\n- /g, ". ").replace(/\n\n/g, " ").replace(/\.\./g, ".")

  // Start with explicit recipient mention if available
  if (recipientInfo) {
    if (originalPrompt.includes("Draft an email") || originalPrompt.includes("Write an email")) {
      formatted = `Write an email to ${recipientInfo}. ${formatted}`
    } else if (originalPrompt.includes("Draft a memo") || originalPrompt.includes("Write a memo")) {
      formatted = `Create a memo for ${recipientInfo}. ${formatted}`
    } else if (originalPrompt.includes("Write a letter")) {
      formatted = `Write a letter to ${recipientInfo}. ${formatted}`
    } else {
      formatted = `Create content for ${recipientInfo}. ${formatted}`
    }
  }

  // Final cleanup to handle consecutive spaces and periods
  formatted = formatted.replace(/\s+/g, " ").replace(/\.\s+\./g, ".")

  return formatted.trim()
}
