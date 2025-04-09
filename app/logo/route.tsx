import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 128,
        background: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#3B82F6",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
          width: 400,
          height: 400,
          borderRadius: 200,
        }}
      >
        <div style={{ fontSize: 200, color: "white", marginBottom: -20 }}>P</div>
        <div style={{ fontSize: 48, color: "white", fontWeight: "bold" }}>PromptMe</div>
      </div>
    </div>,
    {
      width: 512,
      height: 512,
    },
  )
}
