// Templates for prompt enhancement
export const PROMPT_TEMPLATES = [
  "Make this sound more professional",
  "Simplify this text",
  "Soften this language (make it sound nicer)",
  "Analyze this text",
  "Draft an email",
  "Draft a memo",
  "Write a letter",
  "Develop a workout plan",
  "Help me with my investment portfolio",
  "Other",
]

// Additional template questions for enhanced prompts
export const TEMPLATE_QUESTIONS: Record<string, string[]> = {
  "Make this sound more professional": [
    "What industry or context is this for?",
    "Who is the intended audience?",
    "Are there specific style guidelines to follow?",
  ],
  "Simplify this text": [
    "What is the target audience's reading level?",
    "Are there any technical terms that need special attention?",
    "What is the primary goal of simplification?",
  ],
  "Soften this language (make it sound nicer)": [],
  "Analyze this text": ["What industry or context is this for?", "What is the primary purpose of this analysis?"],
  "Draft an email": [
    "Who is the recipient of the email?",
    "What is the primary purpose of the email?",
    "What tone would you like the email to have?",
    "Are there any specific points you want to include?",
  ],
  "Draft a memo": [
    "Who is the memo addressed to?",
    "What is the main topic of the memo?",
    "What key information needs to be communicated?",
    "What is the desired tone (formal, casual, urgent)?",
  ],
  "Write a letter": [
    "Is this a personal or professional letter?",
    "Who is the recipient?",
    "What is the primary purpose of the letter?",
    "What tone would you like to convey?",
  ],
  "Develop a workout plan": [
    "What are your fitness goals?",
    "Do you have any physical limitations?",
    "How many days per week can you commit?",
    "What equipment do you have access to?",
  ],
  "Help me with my investment portfolio": [
    "What type of investment account? (retirement, brokerage, etc.)",
    "Are there specific guidelines you want to follow?",
    "Is your risk tolerance low, medium, or high?",
  ],
  Other: [],
}
