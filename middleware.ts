import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Handle .well-known routes for ChatGPT plugin
  if (request.nextUrl.pathname.startsWith("/.well-known")) {
    const filePath = request.nextUrl.pathname.replace("/.well-known/", "")

    if (filePath === "ai-plugin.json") {
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
          url: `${request.nextUrl.origin}/.well-known/openapi.yaml`,
        },
        logo_url: `${request.nextUrl.origin}/logo`,
        contact_email: "support@trackline-solutions.com",
        legal_info_url: `${request.nextUrl.origin}/legal`,
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/.well-known/:path*"],
}
