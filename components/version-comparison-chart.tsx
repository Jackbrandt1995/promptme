"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { MODEL_COMPARISON_DATA } from "@/lib/data"

export default function VersionComparisonChart() {
  const [showAllModels, setShowAllModels] = useState(false)

  // Define model groups for filtering
  const modelGroups = {
    main: ["gpt-4", "claude-3-opus", "gemini-ultra", "pplx-70b-online"],
    chatgpt: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o", "o1", "o1-mini", "o3-mini", "o3-mini-high"],
    claude: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    perplexity: ["pplx-7b-online", "pplx-70b-online"],
    gemini: ["gemini-pro", "gemini-ultra"],
    github: ["copilot"],
  }

  // Colors for different model families
  const modelColors = {
    "gpt-3.5-turbo": "#93C5FD",
    "gpt-4": "#3B82F6",
    "gpt-4-turbo": "#2563EB",
    "gpt-4o": "#1D4ED8",
    o1: "#1E40AF",
    "o1-mini": "#60A5FA",
    "o3-mini": "#93C5FD",
    "o3-mini-high": "#3B82F6",
    "claude-3-opus": "#7C3AED",
    "claude-3-sonnet": "#8B5CF6",
    "claude-3-haiku": "#A78BFA",
    "pplx-7b-online": "#EC4899",
    "pplx-70b-online": "#DB2777",
    "gemini-pro": "#059669",
    "gemini-ultra": "#047857",
    copilot: "#4B5563",
  }

  // Filter data based on showAllModels state
  const chartData = MODEL_COMPARISON_DATA.map((item) => {
    if (showAllModels) {
      return item
    } else {
      // Only include main models
      const filteredItem: any = { name: item.name }
      modelGroups.main.forEach((model) => {
        filteredItem[model] = item[model]
      })
      return filteredItem
    }
  })

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Model Comparison</h2>
        <button onClick={() => setShowAllModels(!showAllModels)} className="text-blue-600 hover:text-blue-800 text-sm">
          {showAllModels ? "Show Main Models" : "Show All Models"}
        </button>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            {Object.entries(modelColors).map(([model, color]) => {
              if (!showAllModels && !modelGroups.main.includes(model)) {
                return null
              }
              return <Bar key={model} dataKey={model} fill={color} name={model} />
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-gray-500 italic">
        Source: Data compiled from official model documentation and benchmarks - OpenAI (2024), Anthropic (2024), Google
        (2024), Perplexity AI (2024), and GitHub (2024). Performance metrics are relative scores on a scale of 1-10
        based on published evaluations and real-world testing.
      </div>
    </div>
  )
}
