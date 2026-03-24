import { useState } from 'react'
import { AI_MODELS } from '../services/aiAnalysis'
import type { AiModel } from '../services/aiAnalysis'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem('finnhub_api_key') || ''
  )
  const [aiModel, setAiModel] = useState<AiModel>(
    () => (localStorage.getItem('ai_model') as AiModel) || 'llama-3.1-8b-instant'
  )

  if (!isOpen) return null

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('finnhub_api_key', apiKey.trim())
    } else {
      localStorage.removeItem('finnhub_api_key')
    }
    localStorage.setItem('ai_model', aiModel)
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

        {false && (
          <div className="mb-4"></div>
        )}

        <div className="mb-4">
          <label className="block text-xs text-purple-400 mb-1">
            AI Model
          </label>
          <div className="flex gap-2">
            {AI_MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => setAiModel(m.id)}
                className={`flex-1 px-3 py-2 rounded text-xs font-bold transition-all ${
                  aiModel === m.id
                    ? 'bg-purple-500/15 border border-purple-500/50 text-purple-300'
                    : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                <div>{m.name}</div>
                <div className="text-[9px] font-normal opacity-60 mt-0.5">{m.provider}</div>
              </button>
            ))}
          </div>
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
