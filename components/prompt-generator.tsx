"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import VersionInfo from "./version-info"
import { AI_MODELS } from "@/lib/data"
import { HelpCircle, Loader2, Sparkles, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModelHelpDialog } from "./model-help-dialog"

const PROMPT_TEMPLATES = [
  "Draft an email",
  "Draft a memo",
  "Write a letter",
  "Simplify this text",
  "Make this sound more professional",
  "Soften this language (make it sound nicer)",
  "Analyze this text",
  "Develop a workout plan",
  "Help me with my investment portfolio",
  "Write a blog post",
  "Create a marketing campaign",
  "Design a lesson plan",
  "Write a product description",
  "Create a social media post",
  "Write a speech",
  "Develop a business plan",
  "Create a research proposal",
  "Write a press release",
]

// Model-specific formatting guidelines
const MODEL_FORMATTING = {
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
  o1: {
    prefix: "",
    suffix: "",
  },
  "o1-mini": {
    prefix: "",
    suffix: "",
  },
  "o3-mini": {
    prefix: "",
    suffix: "",
  },
  "o3-mini-high": {
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
  "pplx-7b-online": {
    prefix: "",
    suffix: "",
  },
  "pplx-70b-online": {
    prefix: "",
    suffix: "",
  },
  "gemini-pro": {
    prefix: "",
    suffix: "",
  },
  "gemini-ultra": {
    prefix: "",
    suffix: "",
  },
  copilot: {
    prefix: "// ",
    suffix: "",
  },
}

export default function PromptGenerator() {
  // Use refs for uncontrolled components
  const queryInputRef = useRef<HTMLTextAreaElement>(null)
  const followUpRefs = useRef<{ [key: string]: HTMLTextAreaElement }>({})

  const [selectedVersion, setSelectedVersion] = useState("gpt-4o")
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [copySuccess, setCopySuccess] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [useAdvancedMode, setUseAdvancedMode] = useState(true) // Default to advanced mode
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [promptStats, setPromptStats] = useState({ charCount: 0, wordCount: 0 })

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const version = e.target.value
    setSelectedVersion(version)
  }

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = e.target.value
    setSelectedTemplate(template)

    if (template) {
      fetchFollowUpQuestions(template)
    } else {
      setFollowUpQuestions([])
      setShowFollowUp(false)
    }
  }

  const fetchFollowUpQuestions = async (template: string) => {
    setIsLoadingQuestions(true)
    try {
      const response = await fetch("/api/generate-advanced-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedOption: template,
          isGenerateButtonClick: false, // This is not a button click
        }),
      })

      const data = await response.json()

      if (data.followUpQuestions && data.followUpQuestions.length > 0) {
        setFollowUpQuestions(data.followUpQuestions)
        setShowFollowUp(true)
      } else {
        setFollowUpQuestions([])
        setShowFollowUp(false)
      }
    } catch (err) {
      console.error("Error fetching follow-up questions:", err)
      setError("Failed to load follow-up questions. Please try again.")
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const generatePrompt = async () => {
    // Get values from refs for uncontrolled components
    const userQuery = queryInputRef.current?.value || ""

    // Check if we're in advanced mode with a template selected or if we have a query
    if ((!useAdvancedMode && !userQuery.trim()) || (useAdvancedMode && !selectedTemplate)) {
      setError("Please enter a query or select a template")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      let rawPrompt = ""

      if (useAdvancedMode && selectedTemplate) {
        // Collect follow-up answers from refs
        const currentFollowUpAnswers: Record<string, string> = {}
        followUpQuestions.forEach((question) => {
          if (followUpRefs.current[question]) {
            currentFollowUpAnswers[question] = followUpRefs.current[question].value || ""
          }
        })

        console.log("Sending advanced prompt request with answers:", currentFollowUpAnswers)

        // Use advanced prompt generation with templates
        const response = await fetch("/api/generate-advanced-prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedOption: selectedTemplate,
            userResponses: currentFollowUpAnswers,
            isGenerateButtonClick: true, // Add this flag to indicate this is a button click
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate prompt")
        }

        const data = await response.json()
        console.log("Advanced prompt response:", data)

        // Check if we have a prompt in the response
        if (data.prompt) {
          rawPrompt = data.prompt
          console.log("Received prompt:", rawPrompt)
        } else {
          // Create a fallback prompt if none was returned
          console.error("No prompt in API response:", data)
          rawPrompt = `As an expert in ${selectedTemplate.toLowerCase()}, please help me with the following details:`

          // Add user responses to the fallback prompt
          Object.entries(currentFollowUpAnswers).forEach(([question, answer]) => {
            if (answer && answer.trim()) {
              rawPrompt += `\n- ${question}: ${answer}`
            }
          })
        }
      } else {
        // Use standard prompt generation
        const response = await fetch("/api/generate-prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: selectedVersion,
            query: userQuery,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate prompt")
        }

        const data = await response.json()

        // Always check if prompt exists in the response
        if (!data.prompt) {
          console.error("API response missing prompt:", data)
          // Use a fallback prompt instead of throwing an error
          rawPrompt = `I need help with: ${userQuery}. Please provide a detailed response.`
        } else {
          rawPrompt = data.prompt
        }
      }

      // Ensure we have a non-empty prompt
      if (!rawPrompt || rawPrompt.trim() === "") {
        console.error("Empty prompt received, using fallback")
        if (useAdvancedMode && selectedTemplate) {
          rawPrompt = `As an expert in ${selectedTemplate.toLowerCase()}, please help me with this task.`
        } else {
          rawPrompt = `I need help with: ${userQuery}. Please provide a detailed response.`
        }
      }

      // Post-process the prompt to ensure it's fully refined and ready to use
      const finalPrompt = postProcessPrompt(rawPrompt, selectedVersion)
      setGeneratedPrompt(finalPrompt)

      // Calculate and set prompt statistics
      const charCount = finalPrompt.length
      const wordCount = finalPrompt.split(/\s+/).filter((word) => word.length > 0).length
      setPromptStats({ charCount, wordCount })
    } catch (err: any) {
      console.error("Error generating prompt:", err)
      setError(err.message || "Failed to generate prompt. Please try again.")

      // Create a fallback prompt even in case of error
      let fallbackPrompt = ""
      if (useAdvancedMode && selectedTemplate) {
        fallbackPrompt = `As an expert in ${selectedTemplate.toLowerCase()}, please help me with this task.`
      } else {
        fallbackPrompt = `I need help with: ${queryInputRef.current?.value || "my request"}. Please provide a detailed response.`
      }

      const finalPrompt = postProcessPrompt(fallbackPrompt, selectedVersion)
      setGeneratedPrompt(finalPrompt)

      // Calculate and set prompt statistics for the fallback
      const charCount = finalPrompt.length
      const wordCount = finalPrompt.split(/\s+/).filter((word) => word.length > 0).length
      setPromptStats({ charCount, wordCount })
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced function to post-process the prompt to ensure it's fully refined and model-specific
  const postProcessPrompt = (prompt: string, modelId: string): string => {
    // Check if prompt is defined before processing
    if (!prompt || typeof prompt !== "string") {
      console.error("Invalid prompt received:", prompt)
      return "Error: Invalid prompt received. Please try again."
    }

    // Get model-specific formatting
    const modelFormat = MODEL_FORMATTING[modelId as keyof typeof MODEL_FORMATTING] || {
      prefix: "",
      suffix: "",
    }

    // Remove any unnecessary whitespace
    let processed = prompt.trim()

    // Apply model-specific formatting
    processed = modelFormat.prefix + processed + modelFormat.suffix

    return processed
  }

  const copyToClipboard = async () => {
    if (!generatedPrompt) return

    const textToCopy = generatedPrompt

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopySuccess(true)
      setError("")
      setTimeout(() => {
        setCopySuccess(false)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      setError("Failed to copy. Please press Ctrl+C or ⌘+C to copy manually.")
      setCopySuccess(false)
    }
  }

  // Handle key press for the entire form
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault()
      generatePrompt()
    }
  }

  function FollowUpQuestions({
    questions,
    isLoading,
  }: {
    questions: string[]
    isLoading: boolean
  }) {
    useEffect(() => {
      // Reset refs when questions change
      followUpRefs.current = {}
    }, [])

    if (isLoading) {
      return (
        <div className="space-y-4 mb-6 text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-600">Loading questions...</p>
        </div>
      )
    }

    return (
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900">Please provide more details:</h3>
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-semibold text-blue-600">Important:</span> Your specific inputs will be directly
          incorporated into the CRAFT framework to create a customized prompt for your selected AI model.
        </p>
        {questions.length > 0 ? (
          <>
            {questions.map((question, index) => (
              <div key={index} className="space-y-2">
                <label htmlFor={`question-${index}`} className="block text-sm font-medium text-gray-700">
                  {question}
                </label>
                <textarea
                  id={`question-${index}`}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={question === "Provide the text" ? 4 : 2}
                  placeholder={
                    question === "Provide the text"
                      ? "Enter the exact text you want to work with"
                      : "Your input will be directly incorporated into the prompt"
                  }
                  ref={(el) => {
                    if (el) followUpRefs.current[question] = el
                  }}
                  tabIndex={index + 1}
                  onKeyDown={(e) => {
                    // Only trigger generate on Enter if this is not a multi-line text field
                    // or if it's a multi-line field but Shift is held
                    if (e.key === "Enter" && (question !== "Provide the text" || !e.shiftKey)) {
                      handleKeyDown(e)
                    }
                  }}
                />
                {question === "Provide the text" && (
                  <p className="text-xs text-gray-500">Press Shift+Enter for new lines</p>
                )}
              </div>
            ))}
            <div className="text-xs text-gray-500 mt-2">Press Tab to move between fields or Enter to generate</div>
          </>
        ) : (
          <div className="text-gray-600 text-center py-4">
            No additional details needed. You can proceed with generating the prompt.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 bg-blue-600 text-white">
        <h1 className="text-2xl font-bold mb-2">Advanced Prompt Generator</h1>
        <p className="text-blue-100">Select an AI model and enter your query to generate an optimized prompt</p>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Generate Copy-Pastable Prompts</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
            onClick={() => setHelpDialogOpen(true)}
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            What model should I use?
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div>
              <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-1">
                AI Model
              </label>
              <select
                id="version"
                value={selectedVersion}
                onChange={handleVersionChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <optgroup label="ChatGPT">
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="o1">o1</option>
                  <option value="o1-mini">o1-mini</option>
                  <option value="o3-mini">o3-mini</option>
                  <option value="o3-mini-high">o3-mini-high</option>
                </optgroup>
                <optgroup label="Claude">
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="claude-3-haiku">Claude 3 Haiku</option>
                </optgroup>
                <optgroup label="Perplexity">
                  <option value="pplx-7b-online">PPLX 7B Online</option>
                  <option value="pplx-70b-online">PPLX 70B Online</option>
                </optgroup>
                <optgroup label="Gemini">
                  <option value="gemini-pro">Gemini Pro</option>
                  <option value="gemini-ultra">Gemini Ultra</option>
                </optgroup>
                <optgroup label="GitHub">
                  <option value="copilot">Copilot</option>
                </optgroup>
              </select>
            </div>

            <VersionInfo versionInfo={AI_MODELS[selectedVersion]} />
          </div>

          <div className="md:col-span-3 space-y-6">
            {useAdvancedMode && (
              <div>
                <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt Template
                </label>
                <select
                  id="template"
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a template...</option>
                  {PROMPT_TEMPLATES.map((template) => (
                    <option key={template} value={template}>
                      {template}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(!useAdvancedMode || !showFollowUp) && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="query" className="block text-sm font-medium text-gray-700">
                    Your Query
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="advancedMode"
                      checked={useAdvancedMode}
                      onChange={(e) => setUseAdvancedMode(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="advancedMode" className="text-sm font-medium text-gray-700">
                      Use Advanced Mode
                    </label>
                    {useAdvancedMode && (
                      <div className="text-xs text-green-600">
                        <Sparkles className="inline-block h-3 w-3 mr-1" />
                        Using CRAFT framework
                      </div>
                    )}
                  </div>
                </div>
                <textarea
                  id="query"
                  ref={queryInputRef}
                  placeholder="Enter your query for the AI model... (Press Enter to generate)"
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-32"
                  tabIndex={0}
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}

            {error && <div className="text-red-600 text-sm">{error}</div>}

            {useAdvancedMode && showFollowUp && (
              <FollowUpQuestions questions={followUpQuestions} isLoading={isLoadingQuestions} />
            )}

            <div className="flex justify-end space-x-3">
              <Button
                onClick={generatePrompt}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Prompt</span>
                  </div>
                )}
              </Button>
            </div>

            {generatedPrompt && (
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium text-gray-700">Ready to Copy & Paste</h3>
                    <p className="text-xs text-gray-500">
                      {promptStats.charCount} characters • {promptStats.wordCount} words
                    </p>
                  </div>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className={copySuccess ? "text-green-600 border-green-600" : "text-blue-600"}
                  >
                    {copySuccess ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap text-gray-800 max-h-96 overflow-y-auto">
                  {generatedPrompt}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ModelHelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} onModelSelect={setSelectedVersion} />
    </div>
  )
}
