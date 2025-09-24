'use client'

interface EmailSentProps {
  email: string
  onBack: () => void
}

export default function EmailSent({ email, onBack }: EmailSentProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Check your email
      </h2>

      <p className="text-gray-600 mb-6">
        We've sent a magic link to <strong>{email}</strong>
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>📧 Check your inbox</strong><br />
          Click the link in the email to continue creating your book list.
          The link will expire in 15 minutes.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Didn't receive the email? Check your spam folder or try again.
        </p>

        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Use a different email address
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Having trouble? The email should arrive within a few minutes.
        </p>
      </div>
    </div>
  )
}