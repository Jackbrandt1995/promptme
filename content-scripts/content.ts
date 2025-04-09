// Content script that injects functionality into AI websites

// Define the sites we support and their input selectors
const SUPPORTED_SITES = {
  "chat.openai.com": {
    inputSelector: "textarea[data-id='root']",
    submitSelector: "button[data-testid='send-button']",
  },
  "claude.ai": {
    inputSelector: "div[contenteditable='true']",
    submitSelector: "button[aria-label='Send message']",
  },
  "poe.com": {
    inputSelector: "div[contenteditable='true']",
    submitSelector: "button[class*='ChatMessageSendButton']",
  },
  "bard.google.com": {
    inputSelector: "div[contenteditable='true']",
    submitSelector: "button[aria-label='Send']",
  },
  "perplexity.ai": {
    inputSelector: "div[contenteditable='true']",
    submitSelector: "button[aria-label='Send message']",
  },
}

// Initialize when the page loads
function initialize() {
  // Check if the current site is supported
  const currentSite = Object.keys(SUPPORTED_SITES).find((site) => window.location.hostname.includes(site))

  if (!currentSite) return

  // Check if the site is enabled in settings
  chrome.runtime.sendMessage({ action: "checkSiteEnabled" }, (response) => {
    if (response && response.isEnabled) {
      injectEnhancerButton(currentSite)
    }
  })

  // Listen for message from popup to insert enhanced prompt
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "insertPrompt") {
      insertPromptToInput(message.prompt, currentSite)
      sendResponse({ success: true })
    }
  })
}

// Inject the enhancer button next to the input field
function injectEnhancerButton(site: string) {
  const config = SUPPORTED_SITES[site as keyof typeof SUPPORTED_SITES]
  if (!config) return

  // Find the input element
  const inputElement = document.querySelector(config.inputSelector)
  if (!inputElement) {
    console.log(`Input element not found for ${site}`)
    return
  }

  // Create the enhancer button
  const button = document.createElement("button")
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wand-2">
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"></path>
      <path d="m14 7 3 3"></path>
      <path d="M5 6v4"></path>
      <path d="M19 14v4"></path>
      <path d="M10 2v2"></path>
      <path d="M7 8H3"></path>
      <path d="M21 16h-4"></path>
      <path d="M22 22l-5-5"></path>
    </svg>
  `
  button.style.cssText = `
    position: absolute;
    z-index: 1000;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #666;
    padding: 4px;
    border-radius: 4px;
  `
  button.title = "Enhance your prompt"

  // Position the button relative to the input
  const inputRect = inputElement.getBoundingClientRect()

  // Adjust positioning based on the site
  if (site === "chat.openai.com") {
    button.style.right = "60px"
    button.style.bottom = "18px"
    inputElement.parentElement?.appendChild(button)
  } else {
    button.style.top = "0px"
    button.style.right = "40px"
    inputElement.parentElement?.style.position = "relative"
    inputElement.parentElement?.appendChild(button)
  }

  // Add the click event to open the popup when clicking the button
  button.addEventListener("click", () => {
    // Get the current input text
    let inputText = ""

    if (inputElement instanceof HTMLTextAreaElement) {
      inputText = inputElement.value
    } else if (inputElement instanceof HTMLDivElement) {
      inputText = inputElement.innerText || inputElement.textContent || ""
    }

    // Open the popup with the current input text
    chrome.runtime.sendMessage({
      action: "openPopup",
      inputText: inputText.trim(),
    })
  })
}

// Function to insert the enhanced prompt into the input field
function insertPromptToInput(prompt: string, site: string) {
  const config = SUPPORTED_SITES[site as keyof typeof SUPPORTED_SITES]
  if (!config) return

  const inputElement = document.querySelector(config.inputSelector)
  if (!inputElement) return

  // Insert the text based on the element type
  if (inputElement instanceof HTMLTextAreaElement) {
    inputElement.value = prompt
    inputElement.dispatchEvent(new Event("input", { bubbles: true }))
  } else if (inputElement instanceof HTMLDivElement) {
    inputElement.innerText = prompt
    inputElement.dispatchEvent(new Event("input", { bubbles: true }))
    inputElement.dispatchEvent(new Event("change", { bubbles: true }))
  }

  // Focus the input element
  inputElement.focus()
}

// Initialize the content script
initialize()

// Listen for dynamic page changes (SPAs often load content dynamically)
const observer = new MutationObserver((mutations) => {
  const currentSite = Object.keys(SUPPORTED_SITES).find((site) => window.location.hostname.includes(site))

  if (currentSite) {
    const config = SUPPORTED_SITES[currentSite as keyof typeof SUPPORTED_SITES]

    // Check if our button is already present
    const existingButton = document.querySelector(".prompt-enhancer-button")
    if (!existingButton) {
      // If not, try to inject it again
      injectEnhancerButton(currentSite)
    }
  }
})

// Start observing changes to the DOM
observer.observe(document.body, { childList: true, subtree: true })
