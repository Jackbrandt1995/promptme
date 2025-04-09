"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, ArrowRight, Settings, Wand2 } from "lucide-react"
import { PROMPT_TEMPLATES } from "@/lib/template-data"

// Declare chrome if it's not available (e.g., in a non-extension environment)
declare const chrome: any

export default function Popup() {
  const [inputText, setInputText] = useState("")
  const [enhancedPrompt, setEnhancedPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("Make this sound more professional")
  const [selectedModel, setSelectedModel] = useState("gpt-4o")
  const [copySuccess, setCopySuccess] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("enhance")

  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  // Load settings and current input text when popup opens
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      // Load default settings
      chrome.storage.sync.get(["defaultModel", "defaultTemplate"], (data) => {
        if (data.defaultModel) {
          setSelectedModel(data.defaultModel)
        }
        if (data.defaultTemplate) {
          setSelectedTemplate(data.defaultTemplate)
        }
      })

      // Load current input text if available
      chrome.storage.local.get("currentInputText", (data) => {
        if (data.currentInputText) {
          setInputText(data.currentInputText)
          // Clear it after loading
          chrome.storage.local.remove("currentInputText")
        }
      })
    }
  }, [])

  const handleEnhancePrompt = async () => {
    if (!inputText.trim()) {
      setError("Please enter a prompt to enhance")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Send message to background script to enhance the prompt
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage(
          {
            action: "enhancePrompt",
            prompt: inputText,
            template: selectedTemplate,
            model: selectedModel,
          },
          (response) => {
            setIsLoading(false)

            if (response.success) {
              setEnhancedPrompt(response.enhancedPrompt)
            } else {
              setError(response.error || "Failed to enhance prompt")
              // Provide a fallback
              setEnhancedPrompt(`I need assistance with: ${inputText}. Please provide a detailed response.`)
            }
          },
        )
      } else {
        // Fallback for when not running as an extension
        setIsLoading(false)
        setError("Extension API not available")
        setEnhancedPrompt(`I need assistance with: ${inputText}. Please provide a detailed response.`)
      }
    } catch (err: any) {
      console.error("Error enhancing prompt:", err)
      setIsLoading(false)
      setError(err.message || "Failed to enhance prompt")
      // Provide a fallback
      setEnhancedPrompt(`I need assistance with: ${inputText}. Please provide a detailed response.`)
    }
  }

  const copyToClipboard = async () => {
    if (!enhancedPrompt) return

    try {
      await navigator.clipboard.writeText(enhancedPrompt)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      setError("Failed to copy to clipboard")
    }
  }

  const insertToActiveInput = async () => {
    if (!enhancedPrompt) return

    // Send message to content script to insert the enhanced prompt
    // This will be handled by the browser extension API
    try {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(
            tabs[0].id!,
            {
              action: "insertPrompt",
              prompt: enhancedPrompt,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                throw new Error(chrome.runtime.lastError.message)
              }
            },
          )
        })
      } else {
        throw new Error("Chrome extension API not available.")
      }
    } catch (err) {
      console.error("Failed to insert prompt:", err)
      setError("Failed to insert prompt. Please copy instead.")
    }
  }

  return (
    <div className="w-[380px] p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Prompt Enhancer</h1>
        <Button variant="ghost" size="icon" onClick={() => setActiveTab("settings")}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="enhance" className="flex-1">
            Enhance
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex-1">
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhance" className="mt-4 space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Your Prompt</div>
            <textarea
              ref={textAreaRef}
              className="w-full p-2 border border-gray-300 rounded-md h-24 text-sm"
              placeholder="Enter your prompt here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              className="flex-1 p-2 text-sm border border-gray-300 rounded-md"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {PROMPT_TEMPLATES.map((template) => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>

            <Button onClick={handleEnhancePrompt} disabled={isLoading} className="flex items-center space-x-1">
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1" />
              ) : (
                <Wand2 className="h-4 w-4 mr-1" />
              )}
              <span>Enhance</span>
            </Button>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {enhancedPrompt && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Enhanced Prompt</div>
              <div className="border border-gray-300 rounded-md p-2 bg-gray-50 text-sm mb-3 min-h-24 max-h-48 overflow-y-auto">
                {enhancedPrompt}
              </div>

              <div className="flex space-x-2">
                <Button onClick={copyToClipboard} variant="outline" size="sm" className="flex-1">
                  {copySuccess ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>

                <Button onClick={insertToActiveInput} className="flex-1">
                  <ArrowRight className="h-4 w-4 mr-1" />
                  <span>Insert</span>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {PROMPT_TEMPLATES.map((template) => (
              <Button
                key={template}
                variant={selectedTemplate === template ? "default" : "outline"}
                className="justify-start h-auto py-2 px-3 text-left"
                onClick={() => setSelectedTemplate(template)}
              >
                {template}
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">AI Model</label>
            <select
              className="w-full p-2 text-sm border border-gray-300 rounded-md"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <optgroup label="ChatGPT">
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4o">GPT-4o</option>
              </optgroup>
              <optgroup label="Claude">
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
              </optgroup>
              <optgroup label="Other">
                <option value="gemini-pro">Gemini Pro</option>
                <option value="gemini-ultra">Gemini Ultra</option>
              </optgroup>
            </select>
          </div>

          <div className="text-xs text-gray-500 mt-4">
            <p>Prompt Enhancer v1.0.0</p>
            <p className="mt-1">Based on the CRAFT framework for optimal AI prompting</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
