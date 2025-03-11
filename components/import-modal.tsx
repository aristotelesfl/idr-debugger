"use client"

import { useState } from "react"
import type { WorkflowData } from "@/types/workflow"

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: WorkflowData) => void
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [jsonInput, setJsonInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleImport = () => {
    try {
      const parsedData = JSON.parse(jsonInput)
      onImport(parsedData)
      setJsonInput("")
      setError(null)
    } catch (err) {
      setError("Invalid JSON format. Please check your input.")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Import Workflow JSON</h2>

        <div className="mb-4">
          <label htmlFor="jsonInput" className="block text-sm font-medium mb-2">
            Paste your JSON data here:
          </label>
          <textarea
            id="jsonInput"
            className="w-full h-60 p-2 border border-gray-300 rounded-md"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON data here..."
          />
        </div>

        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={handleImport} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Import
          </button>
        </div>
      </div>
    </div>
  )
}

