// This is the background script for the browser extension
// It handles the core functionality when the extension is running

// Declare chrome variable if it's not already defined (e.g., in a testing environment)
declare const chrome: any

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Prompt Enhancer extension installed")

  // Initialize default settings
  chrome.storage.sync.set({
    defaultModel: "gpt-4o",
    defaultTemplate: "Make this sound more professional",
    enabledSites: ["chat.openai.com", "claude.ai", "poe.com", "bard.google.com", "perplexity.ai"],
    apiEndpoint: "https://your-vercel-deployment-url.vercel.app/api/extension-enhance",
  })
})

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "enhancePrompt") {
    // Process prompt enhancement
    enhancePromptWithAPI(message.prompt, message.template, message.model)
      .then((result) => sendResponse({ success: true, enhancedPrompt: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }))

    return true // Required for async response
  }

  if (message.action === "checkSiteEnabled") {
    // Check if the current site is enabled
    chrome.storage.sync.get("enabledSites", (data) => {
      const enabledSites = data.enabledSites || []
      const hostname = new URL(sender.url || "").hostname

      const isEnabled = enabledSites.some((site: string) => hostname.includes(site))
      sendResponse({ isEnabled })
    })

    return true // Required for async response
  }

  if (message.action === "openPopup") {
    // Store the input text to be used when the popup opens
    chrome.storage.local.set({ currentInputText: message.inputText || "" })
    sendResponse({ success: true })
    return true
  }
})

// Function to enhance prompts using the API
async function enhancePromptWithAPI(prompt: string, template: string, model: string): Promise<string> {
  try {
    // Get the API endpoint from storage
    const data = await new Promise<any>((resolve) => {
      chrome.storage.sync.get("apiEndpoint", resolve)
    })

    const apiEndpoint = data.apiEndpoint || "https://your-vercel-deployment-url.vercel.app/api/extension-enhance"

    // Call the API
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        template,
        model,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json()

    if (result.error) {
      console.warn("API warning:", result.error)
    }

    return result.enhancedPrompt || prompt
  } catch (error) {
    console.error("Error enhancing prompt:", error)

    // Fallback to basic enhancement if API fails
    return `I need assistance with the following: ${prompt}. Please provide a detailed, well-structured response.`
  }
}
