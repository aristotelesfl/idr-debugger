"use client"

export default function DebugControls({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onReset,
}: {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onReset: () => void
}) {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 p-4 border border-gray-200 rounded-lg bg-white shadow-lg z-50 w-auto max-w-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Debug Controls</h3>
        <span className="text-sm text-gray-500">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          className="bg-green-600 h-2.5 rounded-full"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        ></div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onPrevious}
          disabled={currentStep <= 0}
          className={`px-3 py-1 rounded-md ${
            currentStep <= 0
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Previous
        </button>

        <button
          onClick={onNext}
          disabled={currentStep >= totalSteps - 1}
          className={`px-3 py-1 rounded-md ${
            currentStep >= totalSteps - 1
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Next
        </button>

        <button onClick={onReset} className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 ml-auto">
          Reset
        </button>
      </div>
    </div>
  )
}

