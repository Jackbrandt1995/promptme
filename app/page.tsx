import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">PromptMe</h1>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/legal" className="text-gray-600 hover:text-gray-900">
                  Legal
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/user-agreement" className="text-gray-600 hover:text-gray-900">
                  User Agreement
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Enhance Your AI Prompts
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Get better responses from AI models with our CRAFT framework-powered prompt enhancement.
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">How to Use PromptMe</h3>
            <div className="mt-5 prose prose-blue text-gray-500">
              <ol>
                <li>
                  <strong>Install the Plugin:</strong> Add PromptMe to your ChatGPT plugins
                </li>
                <li>
                  <strong>Activate the Plugin:</strong> Select PromptMe from your plugin list
                </li>
                <li>
                  <strong>Enhance Your Prompts:</strong> Ask ChatGPT to enhance your prompt using PromptMe
                </li>
              </ol>
              <p>Example: "Using the PromptMe plugin, enhance this prompt: 'Write about climate change'"</p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Professional Writing</h3>
              <p className="mt-2 text-gray-500">
                Transform casual text into polished, professional content suitable for business contexts.
              </p>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Simplified Language</h3>
              <p className="mt-2 text-gray-500">
                Make complex ideas more accessible with clear, straightforward language.
              </p>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Diplomatic Communication</h3>
              <p className="mt-2 text-gray-500">
                Soften language to maintain positive relationships while conveying your message.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white mt-12">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="text-center text-base text-gray-500">&copy; 2025 Trackline Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
