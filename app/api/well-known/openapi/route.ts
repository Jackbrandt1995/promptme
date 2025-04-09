import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  const yaml = `openapi: 3.0.1
info:
  title: PromptMe Plugin
  description: A plugin that enhances prompts using the CRAFT framework.
  version: 'v1'
servers:
  - url: ${baseUrl}
paths:
  /api/enhance-prompt:
    post:
      operationId: enhancePrompt
      summary: Enhance a prompt using the CRAFT framework
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - prompt
              properties:
                prompt:
                  type: string
                  description: The original prompt to enhance
                template:
                  type: string
                  description: The template to use for enhancement
                  enum:
                    - Make this sound more professional
                    - Simplify this text
                    - Soften this language (make it sound nicer)
                    - Analyze this text
                    - Draft an email
                    - Draft a memo
                    - Write a letter
                    - Other
                model:
                  type: string
                  description: The AI model to optimize for
                  enum:
                    - gpt-3.5-turbo
                    - gpt-4
                    - gpt-4-turbo
                    - gpt-4o
                    - claude-3-opus
                    - claude-3-sonnet
                    - claude-3-haiku
                    - gemini-pro
                    - gemini-ultra
      responses:
        "200":
          description: The enhanced prompt
          content:
            application/json:
              schema:
                type: object
                properties:
                  enhancedPrompt:
                    type: string
                    description: The enhanced prompt
                  originalPrompt:
                    type: string
                    description: The original prompt
        "400":
          description: Bad request, missing required parameters
        "500":
          description: Server error`

  return new NextResponse(yaml, {
    headers: {
      "Content-Type": "text/yaml",
    },
  })
}
