/**
 * Build script for the Prompt Enhancer browser extension
 * This script prepares the extension files for deployment to browser stores
 */

import fs from "fs"
import path from "path"
import { execSync } from "child_process"

// Configuration
const OUTPUT_DIR = "extension-dist"
const MANIFEST_PATH = "manifest.json"
const FILES_TO_COPY = [
  "manifest.json",
  "popup.html",
  "popup.css",
  "options.html",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
]

// Create output directory
console.log("Creating output directory...")
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}
if (!fs.existsSync(path.join(OUTPUT_DIR, "icons"))) {
  fs.mkdirSync(path.join(OUTPUT_DIR, "icons"), { recursive: true })
}

// Build TypeScript files
console.log("Building TypeScript files...")
try {
  execSync("npx tsc --project tsconfig.extension.json", { stdio: "inherit" })
} catch (error) {
  console.error("Error building TypeScript files:", error)
  process.exit(1)
}

// Copy static files
console.log("Copying static files...")
FILES_TO_COPY.forEach((file) => {
  try {
    const sourcePath = file
    const destPath = path.join(OUTPUT_DIR, file)

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath)
      console.log(`Copied ${sourcePath} to ${destPath}`)
    } else {
      console.warn(`Warning: ${sourcePath} does not exist, skipping`)
    }
  } catch (error) {
    console.error(`Error copying ${file}:`, error)
  }
})

// Create a zip file for submission to browser stores
console.log("Creating zip file...")
try {
  execSync(`cd ${OUTPUT_DIR} && zip -r ../prompt-enhancer-extension.zip .`, { stdio: "inherit" })
  console.log("Created prompt-enhancer-extension.zip")
} catch (error) {
  console.error("Error creating zip file:", error)
}

console.log("Build complete! Extension files are in the", OUTPUT_DIR, "directory")
console.log("Zip file for store submission: prompt-enhancer-extension.zip")
