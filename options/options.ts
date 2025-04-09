"use client"

// Options page for the extension
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

declare const chrome: any

export default function OptionsPage() {
  // Sites that can be enabled or disabled
  const AVAILABLE_SITES = [
    { id: "chat.openai.com", name: "ChatGPT" },
    { id: "claude.ai", name: "Claude" },
    { id: "poe.com", name: "Poe" },
    { id: "bard.google.com", name: "Google Bard" },
    { id: "gemini.google.com", name: "Google Gemini" },
    { id: "perplexity.ai", name: "Perplexity" },
  ]

  // State for enabled sites
  const [enabledSites, setEnabledSites] = useState<string[]>([])
  const [defaultModel, setDefaultModel] = useState("gpt-4o")
  const [defaultTemplate, setDefaultTemplate] = useState("Make this sound more professional")
  const [apiEndpoint, setApiEndpoint] = useState("")
  const [saveStatus, setSaveStatus] = useState("")

  // Load settings on initial render
  useEffect(() => {
    chrome.storage.sync.get(["enabledSites", "defaultModel", "defaultTemplate", "apiEndpoint"], (data) => {
      if (data.enabledSites) {
        setEnabledSites(data.enabledSites)
      } else {
        // Default to all sites enabled
        setEnabledSites(AVAILABLE_SITES.map((site) => site.id))
      }

      if (data.defaultModel) {
        setDefaultModel(data.defaultModel)
      }

      if (data.defaultTemplate) {
        setDefaultTemplate(data.defaultTemplate)
      }

      if (data.apiEndpoint) {
        setApiEndpoint(data.apiEndpoint)
      }
    })
  }, [])

  // Toggle a site on/off
  const toggleSite = (siteId: string) => {
    setEnabledSites((prev) => {
      if (prev.includes(siteId)) {
        return prev.filter((id) => id !== siteId)
      } else {
        return [...prev, siteId]
      }
    })
  }

  // Save settings
  const saveSettings = () => {
    chrome.storage.sync.set(
      {
        enabledSites,
        defaultModel,
        defaultTemplate,
        apiEndpoint,
      },
      () => {
        setSaveStatus("Settings saved successfully!")
        setTimeout(() => setSaveStatus(""), 3000)
      },
    )
  }

  // Open legal documents in a new tab
  const openLegalDocument = (document: string) => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.openOptionsPage(() => {
        // After options page is open, navigate to the document
        window.location.href = document
      })
    } else {
      // Fallback for when not in extension context
      window.open(document, "_blank")
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">PromptMe Settings</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Enable on Sites</h2>
        <div className="space-y-3">
          {AVAILABLE_SITES.map((site) => (
            <div key={site.id} className="flex items-center justify-between">
              <Label htmlFor={`site-${site.id}`} className="cursor-pointer">
                {site.name}
              </Label>
              <Switch
                id={`site-${site.id}`}
                checked={enabledSites.includes(site.id)}
                onCheckedChange={() => toggleSite(site.id)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Default Settings</h2>

        <div className="mb-4">
          <Label htmlFor="defaultModel" className="block mb-2">
            Default AI Model
          </Label>
          <select
            id="defaultModel"
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="claude-3-opus">Claude 3 Opus</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            <option value="claude-3-haiku">Claude 3 Haiku</option>
            <option value="gemini-pro">Gemini Pro</option>
            <option value="gemini-ultra">Gemini Ultra</option>
          </select>
        </div>

        <div className="mb-4">
          <Label htmlFor="defaultTemplate" className="block mb-2">
            Default Template
          </Label>
          <select
            id="defaultTemplate"
            value={defaultTemplate}
            onChange={(e) => setDefaultTemplate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="Make this sound more professional">Make this sound more professional</option>
            <option value="Simplify this text">Simplify this text</option>
            <option value="Soften this language (make it sound nicer)">Soften this language</option>
            <option value="Analyze this text">Analyze this text</option>
            <option value="Draft an email">Draft an email</option>
            <option value="Draft a memo">Draft a memo</option>
            <option value="Write a letter">Write a letter</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <Label htmlFor="apiEndpoint" className="block mb-2">
            API Endpoint
          </Label>
          <Input
            id="apiEndpoint"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="https://your-vercel-deployment-url.vercel.app/api/extension-enhance"
            className="w-full p-2 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Enter the URL of your deployed Vercel API endpoint</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Legal Information</h2>
        <div className="space-y-2">
          <div>
            <a href="privacy-policy.html" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
          </div>
          <div>
            <a href="user-agreement.html" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
              User Agreement
            </a>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-green-600">{saveStatus}</div>
        <Button onClick={saveSettings}>Save Settings</Button>
      </div>
    </div>
  )
}
