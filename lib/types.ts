export interface VersionInfoType {
  capabilities: string[]
  limitations: string[]
  prompt_strategies: string[]
}

export interface AIModels {
  [key: string]: VersionInfoType
}

export interface KnowledgeTemplate {
  pattern: string
  template: string
  category?: string
  score?: number
}

export interface KnowledgeBase {
  [key: string]: KnowledgeTemplate[]
}

export interface ModelComparisonData {
  name: string
  "gpt-3.5": number
  "gpt-4": number
  "gpt-4-turbo": number
  "gpt-4o": number
  o1: number
  "o1-mini": number
  "o3-mini": number
  "o3-mini-high": number
}

export interface ScheduledTask {
  id: string
  name: string
  version: string
  query: string
  schedule: string
  lastRun?: string
  nextRun?: string
  enabled: boolean
  createdAt: string
}

export interface ScheduleFrequency {
  label: string
  value: string
}
