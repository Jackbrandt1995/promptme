export class QueryBuilder {
  private followUpQuestions: { [key: string]: string[] } = {
    "Draft an email": [
      "Who is the recipient of the email?",
      "What is the primary purpose of the email?",
      "What tone would you like the email to have?",
      "Are there any specific points you want to include?",
    ],
    "Draft a memo": [
      "Who is the memo addressed to?",
      "What is the main topic of the memo?",
      "Are there any specific points you want to include?",
      "What key information needs to be communicated?",
      "What is the desired tone (formal, casual, urgent)?",
    ],
    "Write a letter": [
      "Is this a personal or professional letter?",
      "Who is the recipient?",
      "What is the primary purpose of the letter?",
      "Are there any specific points you want to include?",
      "What tone would you like to convey?",
    ],
    "Make this sound more professional": [
      "Provide the text",
      "What industry or context is this for?",
      "Are there specific style guidelines to follow?",
      "Who is the intended audience?",
    ],
    "Develop a workout plan": [
      "What are your fitness goals?",
      "Do you have any physical limitations?",
      "How many days per week can you commit?",
      "What equipment do you have access to?",
    ],
    "Soften this language (make it sound nicer)": ["Provide the text"],
    "Analyze this text": [
      "Provide the text",
      "What industry or context is this for?",
      "What is the primary purpose of this analysis?",
    ],
    "Simplify this text": [
      "Provide the text",
      "What is the target audience's reading level?",
      "Are there any technical terms that need special attention?",
      "What is the primary goal of simplification?",
    ],
    "Help me with my investment portfolio": [
      "What type of investment account? (retirement, brokerage, etc.)",
      "Are there specific guidelines you want me to follow?",
      "Is your risk tolerance low, medium, or high?",
    ],
  }

  getFollowUpQuestions(selectedOption: string): string[] {
    return this.followUpQuestions[selectedOption] || []
  }

  hasEnoughInformation(selectedOption: string, userResponses: { [key: string]: string }): boolean {
    // For initial API calls, check if we have any responses
    return userResponses && Object.keys(userResponses).length > 0
  }

  buildComprehensivePrompt(selectedOption: string, userResponses: { [key: string]: string }): string {
    // Create a CRAFT framework prompt with the user's specific inputs
    let craftPrompt = "# CRAFT FRAMEWORK PROMPT\n\n"

    // Add Context section - provide background information
    craftPrompt += "## Context:\n"

    // Handle text-based templates first
    if (
      selectedOption === "Simplify this text" ||
      selectedOption === "Make this sound more professional" ||
      selectedOption === "Soften this language (make it sound nicer)" ||
      selectedOption === "Analyze this text"
    ) {
      const text = userResponses["Provide the text"] || ""

      if (text) {
        craftPrompt += `I need to ${selectedOption.toLowerCase()} below:\n\n"""${text}"""\n\n`
      } else {
        craftPrompt += `I need to ${selectedOption.toLowerCase()}.\n\n`
      }
    } else {
      // Handle other templates
      switch (selectedOption) {
        case "Draft an email":
          const recipient = userResponses["Who is the recipient of the email?"] || ""
          const purpose = userResponses["What is the primary purpose of the email?"] || ""
          craftPrompt += `I need to write a professional email${recipient ? ` to ${recipient}` : ""}${purpose ? ` regarding ${purpose}` : ""}.\n\n`
          break
        case "Draft a memo":
          const memoRecipient = userResponses["Who is the memo addressed to?"] || ""
          const memoTopic = userResponses["What is the main topic of the memo?"] || ""
          craftPrompt += `I need to create a formal memo${memoRecipient ? ` for ${memoRecipient}` : ""}${memoTopic ? ` about ${memoTopic}` : ""}.\n\n`
          break
        case "Write a letter":
          const letterType = userResponses["Is this a personal or professional letter?"] || ""
          const letterRecipient = userResponses["Who is the recipient?"] || ""
          const letterPurpose = userResponses["What is the primary purpose of the letter?"] || ""
          craftPrompt += `I need to write a ${letterType ? `${letterType} ` : ""}letter${letterRecipient ? ` to ${letterRecipient}` : ""}${letterPurpose ? ` regarding ${letterPurpose}` : ""}.\n\n`
          break
        case "Develop a workout plan":
          const fitnessGoals = userResponses["What are your fitness goals?"] || ""
          craftPrompt += `I need to develop a workout plan${fitnessGoals ? ` to achieve the following goals: ${fitnessGoals}` : ""}.\n\n`
          break
        case "Help me with my investment portfolio":
          const accountType = userResponses["What type of investment account? (retirement, brokerage, etc.)"] || ""
          craftPrompt += `I need help with my ${accountType || "investment"} portfolio.\n\n`
          break
        default:
          craftPrompt += `I need assistance with ${selectedOption.toLowerCase()}.\n\n`
      }
    }

    // Add additional context details if available
    if (selectedOption === "Develop a workout plan") {
      const limitations = userResponses["Do you have any physical limitations?"] || ""
      if (limitations) {
        craftPrompt += `Physical limitations: ${limitations}\n\n`
      }
    } else if (selectedOption === "Help me with my investment portfolio") {
      const guidelines = userResponses["Are there specific guidelines you want me to follow?"] || ""
      if (guidelines) {
        craftPrompt += `Investment guidelines: ${guidelines}\n\n`
      }
    } else if (selectedOption === "Simplify this text") {
      const technicalTerms = userResponses["Are there any technical terms that need special attention?"] || ""
      if (technicalTerms) {
        craftPrompt += `Technical terms that need special attention: ${technicalTerms}\n\n`
      }
    }

    // Add Role section - define the AI's perspective
    craftPrompt += "## Role:\n"
    switch (selectedOption) {
      case "Draft an email":
        craftPrompt += "You are an expert communication specialist with experience in professional email writing.\n\n"
        break
      case "Draft a memo":
        craftPrompt += "You are a professional business writer with expertise in creating effective memos.\n\n"
        break
      case "Make this sound more professional":
        craftPrompt += "You are a professional editor with expertise in business communication.\n\n"
        break
      case "Simplify this text":
        craftPrompt += "You are an expert in clear communication and simplifying complex information.\n\n"
        break
      case "Soften this language (make it sound nicer)":
        craftPrompt += "You are an expert in diplomatic and tactful communication.\n\n"
        break
      case "Analyze this text":
        craftPrompt += "You are an expert analyst with strong critical thinking and evaluation skills.\n\n"
        break
      case "Develop a workout plan":
        craftPrompt += "You are a certified personal trainer and fitness expert.\n\n"
        break
      case "Help me with my investment portfolio":
        craftPrompt += "You are a financial advisor with expertise in investment management.\n\n"
        break
      default:
        craftPrompt += `You are an expert in ${selectedOption.toLowerCase()}.\n\n`
    }

    // Add Audience section - who will receive this content
    craftPrompt += "## Audience:\n"
    if (selectedOption === "Draft an email" && userResponses["Who is the recipient of the email?"]) {
      craftPrompt += `The email is intended for ${userResponses["Who is the recipient of the email?"]}.\n\n`
    } else if (selectedOption === "Draft a memo" && userResponses["Who is the memo addressed to?"]) {
      craftPrompt += `The memo is addressed to ${userResponses["Who is the memo addressed to?"]}.\n\n`
    } else if (selectedOption === "Write a letter" && userResponses["Who is the recipient?"]) {
      craftPrompt += `The letter is addressed to ${userResponses["Who is the recipient?"]}.\n\n`
    } else if (
      selectedOption === "Make this sound more professional" &&
      userResponses["Who is the intended audience?"]
    ) {
      craftPrompt += `The content is intended for ${userResponses["Who is the intended audience?"]}.\n\n`
    } else if (
      selectedOption === "Simplify this text" &&
      userResponses["What is the target audience's reading level?"]
    ) {
      craftPrompt += `The target audience has a ${userResponses["What is the target audience's reading level?"]} reading level.\n\n`
    } else {
      craftPrompt += "The content should be appropriate for the intended recipients.\n\n"
    }

    // Add Format section - define the output structure
    craftPrompt += "## Format:\n"
    switch (selectedOption) {
      case "Draft an email":
        craftPrompt += "Include a subject line, greeting, body paragraphs, and a professional closing.\n\n"
        break
      case "Draft a memo":
        craftPrompt +=
          "Structure the memo with a header (TO, FROM, DATE, SUBJECT), summary, body with key points, and conclusion.\n\n"
        break
      case "Write a letter":
        craftPrompt +=
          "Format as a proper letter with date, address, salutation, body paragraphs, closing, and signature line.\n\n"
        break
      case "Simplify this text":
        craftPrompt +=
          "Maintain the original meaning while using simpler language and structure. Preserve important information.\n\n"
        break
      case "Make this sound more professional":
        craftPrompt += "Rewrite the text using professional language, proper grammar, and a formal structure.\n\n"
        break
      case "Soften this language (make it sound nicer)":
        craftPrompt +=
          "Rewrite the text using more diplomatic, positive, and tactful language while preserving the core message.\n\n"
        break
      case "Analyze this text":
        craftPrompt +=
          "Provide a structured analysis with key points, themes, strengths, weaknesses, and recommendations.\n\n"
        break
      case "Develop a workout plan":
        craftPrompt +=
          "Include workout schedule, specific exercises, sets/reps, rest periods, and progression guidelines.\n\n"
        break
      case "Help me with my investment portfolio":
        craftPrompt +=
          "Provide specific investment recommendations, asset allocation, risk assessment, and rationale.\n\n"
        break
      default:
        craftPrompt += "Provide a clear, well-structured response with appropriate formatting.\n\n"
    }

    // Add Tone section - specify the communication style
    craftPrompt += "## Tone:\n"
    if (selectedOption === "Draft an email" && userResponses["What tone would you like the email to have?"]) {
      craftPrompt += `Use a ${userResponses["What tone would you like the email to have?"]} tone throughout the email.\n\n`
    } else if (
      selectedOption === "Draft a memo" &&
      userResponses["What is the desired tone (formal, casual, urgent)?"]
    ) {
      craftPrompt += `Maintain a ${userResponses["What is the desired tone (formal, casual, urgent)?"]} tone appropriate for business communication.\n\n`
    } else if (selectedOption === "Write a letter" && userResponses["What tone would you like to convey?"]) {
      craftPrompt += `Use a ${userResponses["What tone would you like to convey?"]} tone in the letter.\n\n`
    } else if (selectedOption === "Make this sound more professional") {
      craftPrompt += "Use a formal, professional tone that conveys competence and authority.\n\n"
    } else if (selectedOption === "Soften this language (make it sound nicer)") {
      craftPrompt += "Use a warm, empathetic, and positive tone.\n\n"
    } else if (selectedOption === "Analyze this text") {
      craftPrompt += "Use an objective, analytical tone that is balanced and evidence-based.\n\n"
    } else {
      craftPrompt += "Use a clear, professional tone that's appropriate for the context.\n\n"
    }

    // Add Task section - specify the desired task with specific user input
    craftPrompt += "## Task:\n"
    switch (selectedOption) {
      case "Draft an email":
        const purpose = userResponses["What is the primary purpose of the email?"] || ""
        const points = userResponses["Are there any specific points you want to include?"] || ""

        craftPrompt += `Write a complete email${purpose ? ` about ${purpose}` : ""}.\n\n`

        if (points) {
          craftPrompt += `Include these specific points:\n\n${points}\n\n`
        }
        break

      case "Draft a memo":
        const memoInfo = userResponses["What key information needs to be communicated?"] || ""
        const memoPoints = userResponses["Are there any specific points you want to include?"] || ""

        craftPrompt += "Create a complete memo that effectively communicates"

        if (memoInfo) {
          craftPrompt += `:\n\n${memoInfo}\n\n`
        } else {
          craftPrompt += " the necessary information.\n\n"
        }

        if (memoPoints) {
          craftPrompt += `Include these specific points:\n\n${memoPoints}\n\n`
        }
        break

      case "Write a letter":
        const letterPurpose = userResponses["What is the primary purpose of the letter?"] || ""
        const letterPoints = userResponses["Are there any specific points you want to include?"] || ""

        craftPrompt += `Write a complete letter${letterPurpose ? ` regarding ${letterPurpose}` : ""}.\n\n`

        if (letterPoints) {
          craftPrompt += `Include these specific points:\n\n${letterPoints}\n\n`
        }
        break

      case "Simplify this text":
        const readingLevel = userResponses["What is the target audience's reading level?"] || ""
        const simplificationGoal = userResponses["What is the primary goal of simplification?"] || ""

        craftPrompt += `Simplify the provided text${readingLevel ? ` for a ${readingLevel} reading level` : ""}${simplificationGoal ? ` with the goal of ${simplificationGoal}` : ""}.\n\n`
        break

      case "Make this sound more professional":
        const industry = userResponses["What industry or context is this for?"] || ""
        const styleGuidelines = userResponses["Are there specific style guidelines to follow?"] || ""

        craftPrompt += `Rewrite the provided text to sound more professional${industry ? ` for the ${industry} industry` : ""}.\n\n`

        if (styleGuidelines) {
          craftPrompt += `Follow these specific guidelines:\n\n${styleGuidelines}\n\n`
        }
        break

      case "Develop a workout plan":
        const daysPerWeek = userResponses["How many days per week can you commit?"] || ""
        const equipment = userResponses["What equipment do you have access to?"] || ""

        craftPrompt += "Develop a detailed workout plan"

        if (daysPerWeek) {
          craftPrompt += ` for ${daysPerWeek} days per week`
        }

        if (equipment) {
          craftPrompt += ` using the following equipment: ${equipment}`
        }

        craftPrompt += ".\n\n"
        break

      case "Help me with my investment portfolio":
        const riskTolerance = userResponses["Is your risk tolerance low, medium, or high?"] || ""

        craftPrompt += `Provide investment portfolio advice${riskTolerance ? ` for a ${riskTolerance} risk tolerance` : ""}.\n\n`
        break

      default:
        craftPrompt += `Please help me with ${selectedOption.toLowerCase()} based on the information provided.\n\n`
    }

    return craftPrompt
  }
}
