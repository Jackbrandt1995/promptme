// Mobile-specific code for when the extension is packaged as a mobile app

// For iOS integration
export const iOSMessageHandler = {
  // Send to Swift host app
  sendToApp: (message: any) => {
    // For iOS WebKit integration
    try {
      // @ts-ignore - webkit is available in iOS WebView
      window.webkit.messageHandlers.promptEnhancer.postMessage(message)
    } catch (e) {
      console.error("Failed to send message to iOS app:", e)
    }
  },

  // Receive from Swift host app
  receiveFromApp: (callback: (message: any) => void) => {
    // Set up a global handler that the Swift code can call
    // @ts-ignore - window assignment
    window.handleiOSMessage = (messageString: string) => {
      try {
        const message = JSON.parse(messageString)
        callback(message)
      } catch (e) {
        console.error("Failed to parse iOS message:", e)
      }
    }
  },
}

// For Android integration
export const androidMessageHandler = {
  // Send to Android host app
  sendToApp: (message: any) => {
    try {
      // @ts-ignore - Android interface is injected by the WebView
      window.AndroidPromptEnhancer.handleMessage(JSON.stringify(message))
    } catch (e) {
      console.error("Failed to send message to Android app:", e)
    }
  },

  // Receive from Android host app
  receiveFromApp: (callback: (message: any) => void) => {
    // Set up a global handler that the Android code can call
    // @ts-ignore - window assignment
    window.handleAndroidMessage = (messageString: string) => {
      try {
        const message = JSON.parse(messageString)
        callback(message)
      } catch (e) {
        console.error("Failed to parse Android message:", e)
      }
    }
  },
}

// Detect if running in a mobile WebView
export function isMobileWebView(): boolean {
  const userAgent = navigator.userAgent.toLowerCase()

  // Check for common WebView indicators
  const isAndroidWebView =
    userAgent.indexOf("wv") > -1 || (userAgent.indexOf("android") > -1 && userAgent.indexOf("version/") > -1)

  // Check for iOS WebView
  const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent)

  return isAndroidWebView || isIOSWebView
}

// Initialize mobile integration
export function initMobileAdapter(messageCallback: (message: any) => void) {
  if (!isMobileWebView()) return false

  const userAgent = navigator.userAgent.toLowerCase()

  if (userAgent.indexOf("android") > -1) {
    androidMessageHandler.receiveFromApp(messageCallback)
    return "android"
  } else if (/(iPhone|iPod|iPad)/i.test(navigator.userAgent)) {
    iOSMessageHandler.receiveFromApp(messageCallback)
    return "ios"
  }

  return false
}

// Send enhanced prompt back to mobile app
export function sendEnhancedPromptToMobileApp(prompt: string) {
  const platform = initMobileAdapter(() => {})

  if (platform === "android") {
    androidMessageHandler.sendToApp({
      action: "enhancedPrompt",
      prompt,
    })
  } else if (platform === "ios") {
    iOSMessageHandler.sendToApp({
      action: "enhancedPrompt",
      prompt,
    })
  }
}
