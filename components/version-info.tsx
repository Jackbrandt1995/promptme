import type { VersionInfoType } from "@/lib/types"

interface VersionInfoProps {
  versionInfo: VersionInfoType | undefined
}

export default function VersionInfo({ versionInfo }: VersionInfoProps) {
  if (!versionInfo) return null

  return (
    <div className="bg-blue-50 p-4 rounded-md">
      <h3 className="font-medium text-blue-800 mb-2">Version Info</h3>

      <div className="mb-2">
        <h4 className="text-sm font-medium text-blue-600">Capabilities</h4>
        <ul className="text-sm text-gray-600 list-disc pl-4">
          {versionInfo.capabilities.map((item, i) => (
            <li key={`cap-${i}`}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mb-2">
        <h4 className="text-sm font-medium text-blue-600">Limitations</h4>
        <ul className="text-sm text-gray-600 list-disc pl-4">
          {versionInfo.limitations.map((item, i) => (
            <li key={`lim-${i}`}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-medium text-blue-600">Prompt Strategies</h4>
        <ul className="text-sm text-gray-600 list-disc pl-4">
          {versionInfo.prompt_strategies.map((item, i) => (
            <li key={`str-${i}`}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
