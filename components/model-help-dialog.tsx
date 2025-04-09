"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AI_MODELS } from "@/lib/data"

interface ModelHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onModelSelect: (model: string) => void
}

type Question = {
  id: string
  text: string
  options: {
    text: string
    score: Record<string, number>
  }[]
}

const questions: Question[] = [
  {
    id: "task",
    text: "What type of task do you want to accomplish?",
    options: [
      {
        text: "Complex reasoning or analysis",
        score: {
          "gpt-4o": 3,
          o1: 3,
          "claude-3-opus": 3,
          "gemini-ultra": 3,
          "pplx-70b-online": 2,
        },
      },
      {
        text: "Creative writing or content generation",
        score: {
          "gpt-4": 2,
          "gpt-4-turbo": 2,
          "claude-3-sonnet": 3,
          "gemini-pro": 2,
        },
      },
      {
        text: "Code or technical documentation",
        score: {
          copilot: 3,
          "gpt-4": 2,
          "claude-3-opus": 2,
        },
      },
      {
        text: "Quick, simple responses",
        score: {
          "gpt-3.5-turbo": 3,
          "claude-3-haiku": 3,
          "o1-mini": 2,
          "o3-mini": 2,
        },
      },
    ],
  },
  {
    id: "priority",
    text: "What's your main priority?",
    options: [
      {
        text: "Accuracy and quality",
        score: {
          "gpt-4o": 3,
          "claude-3-opus": 3,
          "gemini-ultra": 3,
          o1: 3,
        },
      },
      {
        text: "Speed and efficiency",
        score: {
          "gpt-3.5-turbo": 3,
          "claude-3-haiku": 3,
          "o3-mini": 2,
          "pplx-7b-online": 2,
        },
      },
      {
        text: "Cost effectiveness",
        score: {
          "gpt-3.5-turbo": 3,
          "claude-3-haiku": 2,
          "o3-mini": 2,
          "pplx-7b-online": 2,
        },
      },
      {
        text: "Large context window",
        score: {
          "claude-3-opus": 3,
          "claude-3-sonnet": 2,
          "gpt-4-turbo": 2,
        },
      },
    ],
  },
  {
    id: "features",
    text: "Any specific features you need?",
    options: [
      {
        text: "Real-time information",
        score: {
          "pplx-70b-online": 3,
          "pplx-7b-online": 2,
        },
      },
      {
        text: "Multimodal capabilities",
        score: {
          "gemini-ultra": 3,
          "gemini-pro": 2,
          "claude-3-opus": 3,
        },
      },
      {
        text: "Code generation",
        score: {
          copilot: 3,
          "gpt-4": 2,
          "claude-3-opus": 2,
        },
      },
      {
        text: "No special requirements",
        score: {
          "gpt-4": 1,
          "gpt-4-turbo": 1,
          "claude-3-sonnet": 1,
        },
      },
    ],
  },
]

export function ModelHelpDialog({ open, onOpenChange, onModelSelect }: ModelHelpDialogProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)

  const handleOptionSelect = (option: { text: string; score: Record<string, number> }) => {
    const newScores = { ...scores }
    Object.entries(option.score).forEach(([model, score]) => {
      newScores[model] = (newScores[model] || 0) + score
    })
    setScores(newScores)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResult(true)
    }
  }

  const getRecommendedModel = () => {
    const sortedModels = Object.entries(scores).sort(([, a], [, b]) => b - a)
    return sortedModels[0]?.[0] || "gpt-4"
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setScores({})
    setShowResult(false)
  }

  const handleModelSelect = () => {
    const recommendedModel = getRecommendedModel()
    onModelSelect(recommendedModel)
    onOpenChange(false)
    resetQuiz()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">
            {showResult ? "Recommended Model" : "Find the Right AI Model"}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          {!showResult ? (
            <>
              <div className="text-lg font-medium mb-4 text-black">{questions[currentQuestion].text}</div>
              <div className="space-y-2">
                {questions[currentQuestion].options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-4 whitespace-normal text-black hover:bg-gray-50"
                    onClick={() => handleOptionSelect(option)}
                  >
                    {option.text}
                  </Button>
                ))}
              </div>
              <div className="text-sm text-gray-600 mt-4">
                Question {currentQuestion + 1} of {questions.length}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-black">Recommended: {getRecommendedModel()}</h3>
                <p className="mt-2 text-gray-800">{AI_MODELS[getRecommendedModel()]?.capabilities[0]}</p>
                <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                  {AI_MODELS[getRecommendedModel()]?.capabilities.slice(1, 3).map((capability, index) => (
                    <li key={index}>{capability}</li>
                  ))}
                </ul>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={resetQuiz} className="flex-1 text-black">
                  Start Over
                </Button>
                <Button onClick={handleModelSelect} className="flex-1">
                  Select This Model
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
