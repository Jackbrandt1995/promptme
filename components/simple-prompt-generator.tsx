"use client"

import type React from "react"
import { useState, useRef } from "react"
import { PROMPT_TEMPLATES, TEMPLATE_QUESTIONS } from "@/lib/template-data"
import { AI_MODELS } from "@/lib/data"
import { HelpCircle, Loader2, Sparkles, Copy, Check, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import VersionInfo from "./version-info"
import { ModelHelpDialog } from "./model-help-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SimplePromptGenerator() {
  // State
  const [selectedModel, setSelectedModel] = useState("gpt-4o")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [questions, setQuestions] = useState<string[]>([])
  const [userInputs, setUserInputs] = useState<Record<string, string>>({})
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [originalPrompt, setOriginalPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [copySuccess, setCopySuccess] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)
  const [promptStats, setPromptStats] = useState({ charCount: 0, wordCount: 0 })
  const [activeTab, setActiveTab] = useState("original")

  // Refs for text areas to enable fallback copy method
  const enhancedTextRef = useRef<HTMLDivElement>(null)
  const originalTextRef = useRef<HTMLDivElement>(null)

  // Handle model selection
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value)
  }

  // Handle template selection
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = e.target.value
    setSelectedTemplate(template)

    // Reset user inputs when template changes
    setUserInputs({})

    // Get questions for the selected template
    if (template) {
      const templateQuestions = TEMPLATE_QUESTIONS[template] || []
      setQuestions(templateQuestions)
    } else {
      setQuestions([])
    }
  }

  // Handle input changes
  const handleInputChange = (question: string, value: string) => {
    setUserInputs((prev) => ({
      ...prev,
      [question]: value,
    }))
  }

  // Generate prompt
  const generatePrompt = async () => {
    if (!selectedTemplate) {
      setError("Please select a template")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/generate-craft-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          template: selectedTemplate,
          userInputs,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate prompt")
      }

      const data = await response.json()

      if (data.prompt) {
        setGeneratedPrompt(data.prompt)
        setOriginalPrompt(data.originalPrompt || "")

        // Calculate stats
        const charCount = data.prompt.length
        const wordCount = data.prompt.split(/\s+/).filter((word) => word.length > 0).length
        setPromptStats({ charCount, wordCount })

        // Set active tab to original by default
        setActiveTab("original")
      } else {
        throw new Error("No prompt returned from API")
      }
    } catch (err: any) {
      console.error("Error generating prompt:", err)
      setError(err.message || "Failed to generate prompt")
    } finally {
      setIsLoading(false)
    }
  }

  // Copy to clipboard with fallback methods
  const copyToClipboard = async () => {
    // Determine which text to copy based on the active tab
    const textToCopy = activeTab === "enhanced" ? generatedPrompt : originalPrompt
    const textRef = activeTab === "enhanced" ? enhancedTextRef : originalTextRef

    if (!textToCopy) {
      setError("No text available to copy")
      return
    }

    try {
      // Try the modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy)
        console.log("Copied using Clipboard API")
      }
      // Fallback to document.execCommand (older browsers)
      else if (textRef.current) {
        console.log("Using execCommand fallback")

        // Create a temporary textarea element
        const textArea = document.createElement("textarea")
        textArea.value = textToCopy

        // Make the textarea out of viewport
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)

        // Select and copy
        textArea.focus()
        textArea.select()
        const success = document.execCommand("copy")

        // Clean up
        document.body.removeChild(textArea)

        if (!success) {
          throw new Error("execCommand copy failed")
        }
      } else {
        // If all else fails, show a message to manually copy
        throw new Error("Clipboard API not available")
      }

      // Show success message
      setCopySuccess(true)
      setError("") // Clear any previous errors
      console.log(`Copied ${activeTab} prompt to clipboard`)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("Copy to clipboard failed:", err)

      // Show a more helpful error message with instructions
      setError("Couldn't automatically copy. Please select the text manually and use Ctrl+C/Cmd+C to copy.")

      // Try to select the text to make it easier for the user
      if (textRef.current) {
        const range = document.createRange()
        range.selectNodeContents(textRef.current)
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }
    }
  }

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent, isMultiline = false) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading && !isMultiline) {
      e.preventDefault()
      generatePrompt()
    }
  }

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 bg-blue-600 text-white">
        <h1 className="text-2xl font-bold mb-2">Prompt Generator</h1>
        <p className="text-blue-100">Generate customized prompts using the CRAFT framework</p>
      </div>

      <div className="p-6">
        <div className="flex justify-center items-center mb-4">
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
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                AI Model
              </label>
              <select
                id="model"
                value={selectedModel}
                onChange={handleModelChange}
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

            <VersionInfo versionInfo={AI_MODELS[selectedModel]} />
          </div>

          <div className="md:col-span-3 space-y-6">
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

            {questions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Please provide details:</h3>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-semibold text-blue-600">Important:</span> Your inputs will be directly
                  incorporated into the CRAFT framework.
                </p>

                {questions.map((question, index) => {
                  const isTextArea =
                    question === "Provide the text" ||
                    question === "Are there any specific points you want to include?" ||
                    question === "Enter your custom text"

                  return (
                    <div key={index} className="space-y-2">
                      <label htmlFor={`question-${index}`} className="block text-sm font-medium text-gray-700">
                        {question}
                      </label>
                      {isTextArea ? (
                        <textarea
                          id={`question-${index}`}
                          value={userInputs[question] || ""}
                          onChange={(e) => handleInputChange(question, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          rows={question === "Enter your custom text" ? 6 : 4}
                          placeholder={
                            question === "Enter your custom text"
                              ? "Enter your text here. It will be processed using the CRAFT framework."
                              : `Enter your ${question.toLowerCase()}`
                          }
                          onKeyDown={(e) => handleKeyDown(e, true)}
                        />
                      ) : (
                        <input
                          id={`question-${index}`}
                          type="text"
                          value={userInputs[question] || ""}
                          onChange={(e) => handleInputChange(question, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Enter ${question.toLowerCase()}`}
                          onKeyDown={handleKeyDown}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex justify-end space-x-3">
              <Button
                onClick={generatePrompt}
                disabled={isLoading || !selectedTemplate}
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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex flex-col">
                    {/* Tabs list now above the content */}
                    <TabsList className="flex mb-3 w-full">
                      <TabsTrigger value="original" className="flex-1 justify-center py-2 text-center">
                        Original CRAFT Prompt
                      </TabsTrigger>
                      <TabsTrigger
                        value="enhanced"
                        className="flex-1 justify-center py-2 text-center flex items-center gap-1"
                      >
                        <Wand2 className="h-4 w-4" />
                        Sample AI Response
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab content below the tabs */}
                    <div className="w-full">
                      <TabsContent value="enhanced" className="mt-0">
                        <div
                          ref={enhancedTextRef}
                          className="bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap text-gray-800 max-h-96 overflow-y-auto"
                        >
                          {generatedPrompt}
                        </div>
                      </TabsContent>
                      <TabsContent value="original" className="mt-0">
                        <div
                          ref={originalTextRef}
                          className="bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap text-gray-800 max-h-96 overflow-y-auto"
                        >
                          {originalPrompt}
                        </div>
                      </TabsContent>
                    </div>
                  </div>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModelHelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} onModelSelect={setSelectedModel} />
    </div>
  )
}
