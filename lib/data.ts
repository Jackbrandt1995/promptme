export const MODEL_COMPARISON_DATA = [
  {
    name: "Reasoning",
    // ChatGPT models
    "gpt-3.5-turbo": 7.0,
    "gpt-4": 8.5,
    "gpt-4-turbo": 9.0,
    "gpt-4o": 9.2,
    o1: 9.5,
    "o1-mini": 8.0,
    "o3-mini": 7.5,
    "o3-mini-high": 8.2,
    // Claude models
    "claude-3-opus": 9.8,
    "claude-3-sonnet": 9.3,
    "claude-3-haiku": 8.0,
    // Perplexity models
    "pplx-7b-online": 7.5,
    "pplx-70b-online": 8.8,
    // Gemini models
    "gemini-pro": 8.7,
    "gemini-ultra": 9.4,
    // Copilot
    copilot: 8.5,
  },
  {
    name: "Speed",
    // ChatGPT models
    "gpt-3.5-turbo": 9.0,
    "gpt-4": 7.5,
    "gpt-4-turbo": 8.0,
    "gpt-4o": 8.5,
    o1: 7.0,
    "o1-mini": 8.8,
    "o3-mini": 9.0,
    "o3-mini-high": 8.5,
    // Claude models
    "claude-3-opus": 7.0,
    "claude-3-sonnet": 8.0,
    "claude-3-haiku": 9.2,
    // Perplexity models
    "pplx-7b-online": 9.0,
    "pplx-70b-online": 8.0,
    // Gemini models
    "gemini-pro": 8.5,
    "gemini-ultra": 7.5,
    // Copilot
    copilot: 9.5,
  },
  {
    name: "Context Window",
    // ChatGPT models
    "gpt-3.5-turbo": 6.0,
    "gpt-4": 7.5,
    "gpt-4-turbo": 9.0,
    "gpt-4o": 8.5,
    o1: 9.0,
    "o1-mini": 7.0,
    "o3-mini": 6.5,
    "o3-mini-high": 7.0,
    // Claude models
    "claude-3-opus": 10.0,
    "claude-3-sonnet": 9.5,
    "claude-3-haiku": 8.0,
    // Perplexity models
    "pplx-7b-online": 7.0,
    "pplx-70b-online": 8.5,
    // Gemini models
    "gemini-pro": 8.0,
    "gemini-ultra": 9.0,
    // Copilot
    copilot: 7.5,
  },
  {
    name: "Accuracy",
    // ChatGPT models
    "gpt-3.5-turbo": 7.5,
    "gpt-4": 9.0,
    "gpt-4-turbo": 9.2,
    "gpt-4o": 9.3,
    o1: 9.5,
    "o1-mini": 8.5,
    "o3-mini": 8.0,
    "o3-mini-high": 8.7,
    // Claude models
    "claude-3-opus": 9.8,
    "claude-3-sonnet": 9.4,
    "claude-3-haiku": 8.5,
    // Perplexity models
    "pplx-7b-online": 8.0,
    "pplx-70b-online": 9.0,
    // Gemini models
    "gemini-pro": 9.0,
    "gemini-ultra": 9.5,
    // Copilot
    copilot: 9.2,
  },
  {
    name: "Cost Efficiency",
    // ChatGPT models
    "gpt-3.5-turbo": 9.5,
    "gpt-4": 7.0,
    "gpt-4-turbo": 7.5,
    "gpt-4o": 7.0,
    o1: 6.5,
    "o1-mini": 8.5,
    "o3-mini": 9.0,
    "o3-mini-high": 8.0,
    // Claude models
    "claude-3-opus": 6.0,
    "claude-3-sonnet": 7.5,
    "claude-3-haiku": 9.0,
    // Perplexity models
    "pplx-7b-online": 8.5,
    "pplx-70b-online": 7.5,
    // Gemini models
    "gemini-pro": 8.5,
    "gemini-ultra": 7.0,
    // Copilot
    copilot: 8.0,
  },
]

export const AI_MODELS = {
  "gpt-3.5-turbo": {
    capabilities: ["Fast response", "Cost-effective", "Good for general tasks"],
    limitations: ["Less nuanced understanding", "May hallucinate facts"],
    prompt_strategies: ["Be clear and concise", "Provide context"],
  },
  "gpt-4": {
    capabilities: ["More nuanced understanding", "Better reasoning", "Handles complex tasks"],
    limitations: ["More expensive", "Slower response times"],
    prompt_strategies: ["Provide detailed instructions", "Break down complex tasks"],
  },
  "gpt-4-turbo": {
    capabilities: ["Fastest response", "Most cost-effective", "Good for general tasks"],
    limitations: ["Less nuanced understanding than GPT-4", "May hallucinate facts"],
    prompt_strategies: ["Be clear and concise", "Provide context"],
  },
  "gpt-4o": {
    capabilities: ["Advanced reasoning", "Complex task handling", "Detailed analysis"],
    limitations: ["Higher cost", "May be slower"],
    prompt_strategies: ["Use structured prompts", "Provide detailed context"],
  },
  o1: {
    capabilities: ["Advanced reasoning", "Complex task handling", "Detailed analysis"],
    limitations: ["Higher cost", "May be slower"],
    prompt_strategies: ["Use structured prompts", "Provide detailed context"],
  },
  "o1-mini": {
    capabilities: ["Fast responses", "Efficient processing", "Good for simple tasks"],
    limitations: ["Less complex reasoning", "Smaller context window", "Simpler outputs"],
    prompt_strategies: ["Keep prompts concise", "Focus on single tasks", "Use direct instructions"],
  },
  "o3-mini": {
    capabilities: ["Fast responses", "Efficient processing", "Good for simple tasks"],
    limitations: ["Less complex reasoning", "Smaller context window", "Simpler outputs"],
    prompt_strategies: ["Keep prompts concise", "Focus on single tasks", "Use direct instructions"],
  },
  "o3-mini-high": {
    capabilities: ["Advanced reasoning", "Complex task handling", "Detailed analysis"],
    limitations: ["Higher cost", "May be slower"],
    prompt_strategies: ["Use structured prompts", "Provide detailed context"],
  },
  "claude-3-opus": {
    capabilities: ["Most advanced reasoning", "Exceptional analysis", "Complex task handling", "200K context window"],
    limitations: ["Higher cost", "May be slower for simple tasks", "Limited availability"],
    prompt_strategies: [
      "Use detailed system prompts",
      "Leverage multi-step reasoning",
      "Include comprehensive context",
    ],
  },
  "claude-3-sonnet": {
    capabilities: ["Strong reasoning", "Good balance of speed/quality", "Large context window", "Multimodal"],
    limitations: ["Less powerful than Opus", "Medium processing speed", "Cost considerations"],
    prompt_strategies: [
      "Balance detail with efficiency",
      "Use clear structured prompts",
      "Include visual context when relevant",
    ],
  },
  "claude-3-haiku": {
    capabilities: ["Fast responses", "Efficient processing", "Good for simple tasks", "Cost-effective"],
    limitations: ["Less complex reasoning", "Smaller context window", "Simpler outputs"],
    prompt_strategies: ["Keep prompts concise", "Focus on single tasks", "Use direct instructions"],
  },
  "pplx-7b-online": {
    capabilities: ["Real-time information", "Web search integration", "Quick responses", "Current events"],
    limitations: ["Limited reasoning depth", "May need fact verification", "Context window constraints"],
    prompt_strategies: ["Include search requirements", "Ask for current information", "Request source citations"],
  },
  "pplx-70b-online": {
    capabilities: ["Advanced reasoning", "Strong analysis", "Web search", "Detailed responses"],
    limitations: ["Higher latency", "Cost considerations", "May be verbose"],
    prompt_strategies: ["Combine search and analysis", "Request structured outputs", "Ask for source validation"],
  },
  "gemini-pro": {
    capabilities: ["Strong reasoning", "Code generation", "Multimodal understanding", "Creative tasks"],
    limitations: ["Inconsistent performance", "Limited context window", "May need specific formatting"],
    prompt_strategies: ["Use clear formatting", "Provide example outputs", "Include visual context"],
  },
  "gemini-ultra": {
    capabilities: ["Advanced reasoning", "Complex problem solving", "Multimodal excellence", "Detailed analysis"],
    limitations: ["Higher cost", "Limited availability", "May be slower"],
    prompt_strategies: ["Leverage multimodal inputs", "Use structured reasoning", "Include detailed context"],
  },
  copilot: {
    capabilities: ["Code expertise", "Technical documentation", "Development workflows", "Real-time suggestions"],
    limitations: ["Focused on development", "Limited general knowledge", "Code-centric responses"],
    prompt_strategies: ["Use technical context", "Include code examples", "Specify development environment"],
  },
}

export const KNOWLEDGE_BASE = {}

export const SCHEDULE_FREQUENCIES = [
  { label: "Every minute", value: "*/1 * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 10 minutes", value: "*/10 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every 30 minutes", value: "0,30 * * * *" },
  { label: "Hourly", value: "0 * * * *" },
  { label: "Daily", value: "0 0 * * *" },
  { label: "Weekly", value: "0 0 * * 0" },
  { label: "Monthly", value: "0 0 1 * *" },
  { label: "Yearly", value: "0 0 1 1 *" },
  { label: "Custom", value: "custom" },
]
