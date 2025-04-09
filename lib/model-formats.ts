// Model-specific formatting to optimize prompts for different AI models
export const MODEL_FORMATTING = {
  "gpt-3.5-turbo": {
    prefix: "",
    suffix: "",
  },
  "gpt-4": {
    prefix: "",
    suffix: "",
  },
  "gpt-4-turbo": {
    prefix: "",
    suffix: "",
  },
  "gpt-4o": {
    prefix: "",
    suffix: "",
  },
  "claude-3-opus": {
    prefix: "Human: ",
    suffix: "\n\nAssistant: ",
  },
  "claude-3-sonnet": {
    prefix: "Human: ",
    suffix: "\n\nAssistant: ",
  },
  "claude-3-haiku": {
    prefix: "Human: ",
    suffix: "\n\nAssistant: ",
  },
  "gemini-pro": {
    prefix: "",
    suffix: "",
  },
  "gemini-ultra": {
    prefix: "",
    suffix: "",
  },
}
