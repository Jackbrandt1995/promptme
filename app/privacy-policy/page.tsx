import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6 prose prose-blue max-w-none">
            <p className="text-sm text-gray-500 italic">Effective date: April 8, 2025</p>

            <p>
              We receive, collect and store any information you enter on our website or provide us in any other way. In
              addition, we collect the Internet protocol (IP) address used to connect your computer to the Internet;
              login; e-mail address; password; computer and connection information and purchase history. We may use
              software tools to measure and collect session information, including page response times, length of visits
              to certain pages, page interaction information, and methods used to browse away from the page. We also
              collect personally identifiable information (including name, email, password, communications); payment
              details (including credit card information), comments, feedback, product reviews, recommendations, and
              personal profile.
            </p>

            <p>
              When you conduct a transaction on our website, as part of the process, we collect personal information you
              give us such as your name, address and email address. Your personal information will be used for the
              specific reasons stated above only.
            </p>

            <h2>How We Use Your Information</h2>
            <p>We collect such Non-personal and Personal Information for the following purposes:</p>
            <ul>
              <li>To provide and operate the Services;</li>
              <li>To provide our Users with ongoing customer assistance and technical support;</li>
              <li>
                To be able to contact our Visitors and Users with general or personalized service-related notices and
                promotional messages;
              </li>
              <li>
                To create aggregated statistical data and other aggregated and/or inferred Non-personal Information,
                which we or our business partners may use to provide and improve our respective services;
              </li>
              <li>To comply with any applicable laws and regulations.</li>
            </ul>

            <h2>ChatGPT Plugin Data Usage</h2>
            <p>When you use our ChatGPT plugin:</p>
            <ul>
              <li>We process the prompts you submit for enhancement</li>
              <li>We do not store your prompts or enhanced results beyond what's necessary to provide the service</li>
              <li>
                We do not use your prompts for training our models or for any purpose other than providing the
                enhancement service
              </li>
              <li>We do not share your prompts with third parties except as required to provide the service</li>
            </ul>

            <h2>Third-Party Services</h2>
            <p>Trackline Solutions relies on trusted third-party platforms, including:</p>
            <ul>
              <li>OpenAI: for natural language processing and AI enhancement</li>
              <li>Vercel: for serverless function deployment and API execution</li>
            </ul>

            <p>
              While Trackline Solutions does not collect or retain any of your data, these third-party services may
              process data as part of your interaction with PromptMe. We encourage you to review their respective
              privacy policies:
            </p>
            <ul>
              <li>
                <a href="https://openai.com/policies/privacy-policy">OpenAI Privacy Policy</a>
              </li>
              <li>
                <a href="https://vercel.com/legal/privacy-policy">Vercel Privacy Policy</a>
              </li>
            </ul>

            <p>Trackline Solutions has no control over the practices of these providers.</p>

            <h2>Privacy Policy Updates</h2>
            <p>
              We reserve the right to modify this privacy policy at any time, so please review it frequently. Changes
              and clarifications will take effect immediately upon their posting on the website. If we make material
              changes to this policy, we will notify you here that it has been updated, so that you are aware of what
              information we collect, how we use it, and under what circumstances, if any, we use and/or disclose it.
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
