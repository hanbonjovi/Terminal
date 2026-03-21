import { useState } from 'react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem('finnhub_api_key') || ''
  )
  const [openRouterKey, setOpenRouterKey] = useState(
    () => localStorage.getItem('openrouter_api_key') || ''
  )

  if (!isOpen) return null

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('finnhub_api_key', apiKey.trim())
    } else {
      localStorage.removeItem('finnhub_api_key')
    }
    if (openRouterKey.trim()) {
      localStorage.setItem('openrouter_api_key', openRouterKey.trim())
    } else {
      localStorage.removeItem('openrouter_api_key')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md p-6">
        <h2 className="text-sm font-bold text-gray-200 mb-4">Settings</h2>

        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1">
            Finnhub API Key (optional fallback)
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your free Finnhub API key"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-green-600"
          />
          <p className="text-[10px] text-gray-600 mt-1">
            Get a free key at finnhub.io — used as fallback when Yahoo Finance is unavailable.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-purple-400 mb-1">
            OpenRouter API Key (for AI Analysis)
          </label>
          <input
            type="password"
            value={openRouterKey}
            onChange={(e) => setOpenRouterKey(e.target.value)}
            placeholder="Enter your OpenRouter API key"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-purple-600"
          />
          <p className="text-[10px] text-gray-600 mt-1">
            Get a free key at openrouter.ai — powers the AI analysis tab using Qwen model.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-400 border border-gray-700 rounded hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs text-green-400 border border-green-800 rounded hover:bg-green-900/30 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
