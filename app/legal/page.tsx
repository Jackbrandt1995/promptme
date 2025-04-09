import Link from "next/link"

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Legal Information</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">PromptMe Plugin</h2>
            <p className="mb-4 text-gray-600">
              The PromptMe plugin is provided by Trackline Solutions to help users craft better prompts for AI
              interactions.
            </p>
            <p className="mb-4 text-gray-600">For detailed legal information, please review our:</p>
            <ul className="list-disc pl-5 mb-6 text-gray-600">
              <li className="mb-2">
                <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/user-agreement" className="text-blue-600 hover:text-blue-800">
                  User Agreement
                </Link>
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="mb-2 text-gray-600">
              If you have any questions about our legal policies, please contact us at:
            </p>
            <p className="text-gray-600">
              Email:{" "}
              <a href="mailto:support@trackline-solutions.com" className="text-blue-600 hover:text-blue-800">
                support@trackline-solutions.com
              </a>
            </p>
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
