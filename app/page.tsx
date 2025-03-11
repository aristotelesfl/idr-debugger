"use client"

import type React from "react"

import { useState, useEffect } from "react"
import WorkflowTree from "@/components/workflow-tree"
import ImportModal from "@/components/import-modal"
import DebugControls from "@/components/debug-controls"
import type { WorkflowData } from "@/types/workflow"

// Empty data state
const emptyData: WorkflowData = {
  data: [],
  meta: { current_page: 0, from: 0, last_page: 0, path: null, per_page: 0, to: 0, total: 0 },
  extra: null,
}

const sampleData: WorkflowData = {
 data: [],
  meta: { current_page: 0, from: 0, last_page: 0, path: null, per_page: 0, to: 0, total: 0 },
  extra: null,
}

export default function Home() {
  const [workflowData, setWorkflowData] = useState<WorkflowData>(emptyData)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [debugPath, setDebugPath] = useState<string[]>([])
  const [currentDebugStep, setCurrentDebugStep] = useState(-1)
  const [debugInput, setDebugInput] = useState("")

  const handleImportJson = (jsonData: WorkflowData) => {
    setWorkflowData(jsonData)
    setIsImportModalOpen(false)
  }

  const handleDebugPathSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Parse the debug path from the input (format: "10000 > 10000.10000 > 10000.10001")
    const path = debugInput
      .split(">")
      .map((step) => step.trim())
      .filter(Boolean)

    setDebugPath(path)
    setCurrentDebugStep(path.length > 0 ? 0 : -1)
  }

  const handleNextStep = () => {
    if (currentDebugStep < debugPath.length - 1) {
      setCurrentDebugStep(currentDebugStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentDebugStep > 0) {
      setCurrentDebugStep(currentDebugStep - 1)
    }
  }

  const handleResetDebug = () => {
    setCurrentDebugStep(-1)
  }

  // Load sample data when clicking the Import button for the first time
  const handleImportClick = () => {
    // If no data has been imported yet, load the sample data
    if (workflowData.data.length === 0) {
      setWorkflowData(sampleData)
    }
    setIsImportModalOpen(true)
  }

  // Add keyboard shortcuts for debugging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts if we're in debug mode
      if (debugPath.length > 0 && currentDebugStep >= 0) {
        if (e.key === "ArrowRight" || e.key === "n") {
          handleNextStep()
        } else if (e.key === "ArrowLeft" || e.key === "p") {
          handlePreviousStep()
        } else if (e.key === "Escape" || e.key === "r") {
          handleResetDebug()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [debugPath, currentDebugStep])

  return (
  <main className="min-h-screen p-4 md:p-8 pb-24">
    <h1 className="text-2xl font-bold mb-6">Workflow Tree Visualizer</h1>

    <div className="flex justify-between mb-6">
      <button
        onClick={handleImportClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Import
      </button>
    </div>

    <div className="mb-8">
      <form onSubmit={handleDebugPathSubmit} className="space-y-4">
        <div>
          <label htmlFor="debugInput" className="block text-sm font-medium mb-2">
            Debug Path (e.g., 10000 &gt; 10000.10000 &gt; 10000.10001):
          </label>
          <div className="flex gap-2">
            <input
              id="debugInput"
              className="flex-grow p-2 border border-gray-300 rounded-md"
              value={debugInput}
              onChange={(e) => setDebugInput(e.target.value)}
              placeholder="Enter debug path..."
            />
            <button 
              type="submit" 
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={workflowData.data.length === 0}
            >
              Debug
            </button>
          </div>
        </div>
      </form>
    </div>

    <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[200px]">
      <WorkflowTree data={workflowData.data} debugPath={debugPath} currentDebugStep={currentDebugStep} />
    </div>

    {debugPath.length > 0 && currentDebugStep >= 0 && (
      <DebugControls
        currentStep={currentDebugStep}
        totalSteps={debugPath.length}
        onNext={handleNextStep}
        onPrevious={handlePreviousStep}
        onReset={handleResetDebug}
      />
    )}

    <ImportModal 
      isOpen={isImportModalOpen} 
      onClose={() => setIsImportModalOpen(false)} 
      onImport={handleImportJson} 
    />
  </main>
)

}

