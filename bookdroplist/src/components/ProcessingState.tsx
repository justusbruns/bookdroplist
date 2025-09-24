'use client'

export default function ProcessingState() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6"></div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Processing your image...
      </h3>

      <p className="text-gray-600 mb-6">
        Our AI is analyzing your photo and extracting book information.
        This usually takes 5-10 seconds.
      </p>

      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Extracting book titles and authors</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
          <span>Finding cover images and metadata</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
          <span>Creating your shareable list</span>
        </div>
      </div>
    </div>
  )
}