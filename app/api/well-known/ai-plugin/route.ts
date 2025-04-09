import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  return NextResponse.json({
    schema_version: "v1",
    name_for_human: "PromptMe",
    name_for_model: "promptme",
    description_for_human: "Enhance your prompts using the CRAFT framework for better AI responses.",
    description_for_model:
      "This plugin helps users craft better prompts using the CRAFT framework (Context, Role, Audience, Format, Tone) to get more accurate and useful responses from AI models.",
    auth: {
      type: "none",
    },
    api: {
      type: "openapi",
      url: `${baseUrl}/.well-known/openapi.yaml`,
    },
    logo_url: `${baseUrl}/logo`,
    contact_email: "support@trackline-solutions.com",
    legal_info_url: `${baseUrl}/legal`,
  })
}
